import { ArrowUpRight } from "lucide-react";

const PageLayout = ({
  title,
  subtitle,
  children,
  showLiveBadge = false,
  stats = [],
  actions,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-[#1F2933]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 mt-1 text-sm lg:text-base">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {showLiveBadge && (
            <div
              className="px-3 lg:px-4 py-2 bg-white border border-gray-200 rounded-xl flex items-center gap-2 lg:gap-3 w-fit"
              style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)" }}
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs lg:text-sm font-medium text-gray-600">
                Live Updates
              </span>
            </div>
          )}
          {actions}
        </div>
      </div>

      {/* Stats Grid - Only render if stats are provided */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 p-4 lg:p-5 rounded-2xl hover:border-gray-300 transition-all group"
              style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)" }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-xl ${stat.colorClass}`}>
                  <stat.icon size={18} className={stat.iconColor} />
                </div>
                {stat.trend !== undefined && (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 ${stat.trend > 0
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                      }`}
                  >
                    <ArrowUpRight
                      size={12}
                      className={stat.trend < 0 ? "rotate-90" : ""}
                    />
                    {Math.abs(stat.trend)}%
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs lg:text-sm font-medium">
                {stat.label}
              </p>
              <h3 className="text-lg lg:text-xl font-bold text-[#1F2933] mt-1">
                {stat.value}
              </h3>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default PageLayout;
