import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

export const revalidate = 0; // Ensures it always fetches latest logs

const prisma = new PrismaClient();

const PRICING: Record<string, number> = {
  "Routes API": 0.005,
  "Dynamic Maps API": 0.007,
};

export default async function LogsPage() {
  let exchangeRate = 83.5;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } });
    const data = await res.json();
    if (data?.rates?.INR) exchangeRate = data.rates.INR;
  } catch (e) {
    console.error("Failed to fetch exchange rate", e);
  }

  const logs = await prisma.apiLog.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const summary = logs.reduce((acc, log) => {
    if (!acc[log.apiName]) {
      acc[log.apiName] = { count: 0, cost: PRICING[log.apiName] || 0 };
    }
    acc[log.apiName].count += 1;
    return acc;
  }, {} as Record<string, { count: number; cost: number }>);

  let totalCost = 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">API Usage & Cost Matrix</h1>
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-medium">
            Back to Map
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">API Name</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Cost per Request</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total Calls</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Object.entries(summary).map(([apiName, data]) => {
                const rowCost = data.count * data.cost;
                totalCost += rowCost;
                return (
                  <tr key={apiName} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{apiName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      ${data.cost.toFixed(3)} <span className="text-gray-400 text-xs ml-1">(₹{(data.cost * exchangeRate).toFixed(2)})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">{data.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-500 text-right">
                      ${rowCost.toFixed(3)} <span className="text-gray-400 text-xs ml-1">(₹{(rowCost * exchangeRate).toFixed(2)})</span>
                    </td>
                  </tr>
                );
              })}
              {Object.keys(summary).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">No API logs found. Start using the map to track costs.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <th colSpan={3} scope="row" className="px-6 py-4 text-right text-sm font-extrabold text-gray-900 uppercase tracking-wider">Grand Total:</th>
                <td className="px-6 py-4 whitespace-nowrap text-right text-xl font-black text-gray-900">
                  ${totalCost.toFixed(3)} <span className="text-gray-500 text-base font-bold ml-1">(₹{(totalCost * exchangeRate).toFixed(2)})</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 tracking-tight text-gray-800">Detailed Request Log</h2>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <li key={log.id} className="px-6 py-3 flex justify-between items-center text-sm hover:bg-gray-50 transition">
                  <span className="font-semibold text-gray-700 w-1/4">{log.apiName}</span>
                  <span className="text-gray-400 font-mono text-xs truncate w-1/2" title={log.endpoint}>{log.endpoint}</span>
                  <span className="text-gray-400 text-xs w-1/4 text-right">{new Date(log.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 tracking-tight text-gray-800">Console API Calls</h2>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <li key={log.id} className="px-6 py-3 flex flex-col text-sm hover:bg-gray-50 transition">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-gray-700 w-1/4">{log.apiName}</span>
                    <span className="text-gray-400 font-mono text-xs truncate w-1/2" title={log.endpoint}>{log.endpoint}</span>
                    <span className="text-gray-400 text-xs w-1/4 text-right">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  {(log.request || log.response) && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-t border-gray-100 pt-3">
                      {log.request && (
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Request Body</h4>
                          <div className="bg-gray-800 text-blue-300 p-3 rounded-md overflow-x-auto text-xs font-mono shadow-inner max-h-64">
                            <pre>{JSON.stringify(log.request, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                      {log.response && (
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Response Body</h4>
                          <div className="bg-gray-900 text-green-400 p-3 rounded-md overflow-x-auto text-xs font-mono shadow-inner max-h-64">
                            <pre>{JSON.stringify(log.response, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
