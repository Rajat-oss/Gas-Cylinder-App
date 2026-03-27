import {
  Calculator,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  FileCheck,
  IndianRupee,
  Printer,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../services/api";

const FinancialSettlement = () => {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [report, setReport] = useState(null);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await api.get("/staff");
        setDrivers(res.data.filter((u) => u.role === "DRIVER"));
      } catch (err) {
        console.error(err);
      }
    };
    fetchDrivers();
  }, []);

  const generateReport = async () => {
    if (!selectedDriver) {
      toast.error("Please select a driver");
      return;
    }
    try {
      const res = await api.get(
        `/orders/report?driverId=${selectedDriver}&date=${selectedDate}`,
      );
      setReport(res.data);
      toast.success("Report generated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    }
  };

  const handleExport = () => {
    toast.success("Exporting report as PDF...");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div
        className="bg-white border border-gray-200 p-5 rounded-2xl"
        style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl">
              <Calculator className="text-gray-600" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F2933]">
                Financial Settlement
              </h2>
              <p className="text-gray-500 text-sm">
                End-of-day reconciliation and bank statement matching
              </p>
            </div>
          </div>
          {report && (
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl flex items-center gap-2 transition-colors text-sm"
              >
                <Download size={16} /> Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#00C853] hover:bg-[#00B248] text-white font-bold rounded-lg flex items-center gap-2 transition-colors text-[13px] tracking-wide shadow-sm shadow-[#00C853]/20"
              >
                <Printer size={16} /> Print Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div
        className="bg-white border border-gray-200 p-5 rounded-2xl"
        style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 ml-1 flex items-center gap-1.5">
              <User size={14} /> Select Driver
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 text-[#1F2933] text-[13px] font-medium focus:ring-1 focus:ring-[#00C853] focus:border-[#00C853] outline-none transition-all shadow-sm"
            >
              <option value="">Choose a staff member...</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 ml-1 flex items-center gap-1.5">
              <Calendar size={14} /> Settlement Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 text-[#1F2933] text-[13px] font-medium focus:ring-1 focus:ring-[#00C853] focus:border-[#00C853] outline-none transition-all shadow-sm"
            />
          </div>
          <button
            onClick={generateReport}
            className="group relative px-5 py-2.5 bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-[13px] tracking-wide rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg shadow-sm shadow-[#00C853]/20"
          >
            <Calculator size={16} strokeWidth={2.5} />
            Check Reconciliation
          </button>
        </div>
      </div>

      {/* Report */}
      {report ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs font-medium mb-1">
                Cylinders Delivered
              </p>
              <h4 className="text-3xl font-bold text-[#1F2933]">
                {report.totalCylinders}{" "}
                <span className="text-sm font-normal text-gray-400">units</span>
              </h4>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs font-medium mb-1">
                Cash Collected
              </p>
              <h4 className="text-3xl font-bold text-emerald-600">
                ₹{report.totalCash}
              </h4>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs font-medium mb-1">
                UPI Payments
              </p>
              <h4 className="text-3xl font-bold text-blue-600">
                ₹{report.totalUPI}
              </h4>
            </div>
            <div className="bg-[#00C853] p-5 rounded-2xl">
              <p className="text-white/80 text-xs font-medium mb-1">
                Expected Collection
              </p>
              <h4 className="text-3xl font-bold text-white">
                ₹{report.expectedTotal}
              </h4>
            </div>
          </div>

          {/* Transaction Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#1F2933] flex items-center gap-2">
                  <IndianRupee size={18} className="text-[#00C853]" /> Cash
                  Transactions
                </h3>
                <span className="bg-[#E8F5E9] text-[#00C853] text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full">
                  ₹{report.totalCash}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs font-medium border-b border-gray-100">
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.cashTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="text-sm hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-500 font-medium">
                          {tx.time}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1F2933]">
                            {tx.customer}
                          </p>
                          <p className="text-xs text-gray-400">{tx.orderId}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1F2933]">
                          ₹{tx.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UPI Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#1F2933] flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-500" /> UPI
                  Transactions
                </h3>
                <span className="bg-[#EBF5FF] text-[#3B82F6] text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full">
                  ₹{report.totalUPI}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs font-medium border-b border-gray-100">
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Customer & Ref</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.upiTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="text-sm hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-500 font-medium">
                          {tx.time}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1F2933]">
                            {tx.customer}
                          </p>
                          <p className="text-xs text-blue-500">{tx.ref}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1F2933]">
                          ₹{tx.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1F2933]">
                  Ready for Settlement
                </h3>
                <p className="text-gray-500 text-sm">
                  Reconciliation matches with driver's mobile app report
                </p>
              </div>
            </div>
            <button className="px-6 py-2 bg-[#00C853] hover:bg-[#00B248] shadow-sm shadow-[#00C853]/20 text-white font-bold text-[13px] tracking-wide rounded-lg transition-colors">
              Confirm Handover
            </button>
          </div>
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white border border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <FileCheck size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#1F2933] mb-1">
            No Report Generated
          </h3>
          <p className="text-gray-500 text-sm">
            Select a driver and date to generate reconciliation
          </p>
        </div>
      )}
    </div>
  );
};

export default FinancialSettlement;
