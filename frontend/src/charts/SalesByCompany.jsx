// Bar chart + pie chart of sales aggregated by company for a task

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Download, RotateCcw } from "lucide-react";

const MARGIN = { top: 20, right: 30, bottom: 40, left: 40 };
const WIDTH = 600;
const HEIGHT = 300;
const CHART_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const CHART_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

export default function SalesByCompany({ records }) {
  const [groupField, setGroupField] = useState("");
  const [groupedByField, setGroupedByField] = useState([]);
  const [groupedByDate, setGroupedByDate] = useState([]);
  const [filter, setFilter] = useState({ year: "", fieldValue: "", startDate: "", endDate: "" });
  const [tooltip, setTooltip] = useState({ show: false, content: "", x: 0, y: 0 });

  const barRef = useRef(null);
  const lineRef = useRef(null);

  const availableFields = Object.keys(records[0] || {}).filter(k => typeof records[0][k] === "string" || typeof records[0][k] === "number");
  const dateField = availableFields.find(f => /date/i.test(f));

  useEffect(() => {
    if (!groupField && availableFields.length) setGroupField(availableFields[0]);
  }, [availableFields]);

  const filteredRecords = records.filter(r => {
    const passYear = filter.year ? r[dateField]?.startsWith(filter.year) : true;
    const passField = filter.fieldValue ? r[groupField] === filter.fieldValue : true;
    const passStartDate = filter.startDate ? new Date(r[dateField]) >= new Date(filter.startDate) : true;
    const passEndDate = filter.endDate ? new Date(r[dateField]) <= new Date(filter.endDate) : true;
    return passYear && passField && passStartDate && passEndDate;
  });

  useEffect(() => {
    // Apply dynamic filters
    const filteredRecords = records.filter(r => {
      
      const hasField = r[groupField] !== undefined && r[groupField] !== null;

      if (!hasField) return false;

      const matchesLocation = filter.fieldValue ? r.location === filter.fieldValue : true;
      const recordDate = new Date(r.date);
      const startDate = filter.startDate ? new Date(filter.startDate) : new Date("1900-01-01");
      const endDate = filter.endDate ? new Date(filter.endDate) : new Date("2100-12-31");
      const matchesDate = recordDate >= startDate && recordDate <= endDate;
      return matchesLocation && matchesDate;
    });

    console.log("Filtered Records:", filteredRecords);

    // Group by field with proper undefined handling
    const groupedField = d3.rollup(
      filteredRecords,
      v => v.length,
      d => d[groupField] || d.name || "Unknown" // Use fallback field or "Unknown"
    );
    setGroupedByField(Array.from(groupedField, ([label, count]) => ({
      label,
      count
    })));

    // Group by date
    const groupedDate = d3.rollup(
      filteredRecords,
      v => v.length,
      d => d[dateField]?.substring(0, 4)
    );
    setGroupedByDate(Array.from(groupedDate, ([year, count]) => ({
      year,
      count
    })));

    console.log("Grouped By Field:", groupedField);
  }, [records, filter, groupField, dateField]);

  console.log("Raw Records:", records);
  console.log("Filtered Records:", filteredRecords);
  console.log("Grouped By Field:", groupedByField);

  const uniqueYears = Array.from(new Set(records.map(r => r[dateField]?.substring(0, 4)).filter(Boolean)));
  const uniqueValues = Array.from(new Set(records.map(r => r[groupField]))).filter(v => typeof v === "string");
  

  const handleExport = () => {
    const svgBar = barRef.current;
    const svgLine = lineRef.current;
    const combined = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    combined.setAttribute("width", 600);
    combined.setAttribute("height", 600);

    const barClone = svgBar.cloneNode(true);
    const lineClone = svgLine.cloneNode(true);
    lineClone.setAttribute("y", "300");
    combined.appendChild(barClone);
    combined.appendChild(lineClone);

    const svgData = new XMLSerializer().serializeToString(combined);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "charts.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFilter({ year: "", fieldValue: "", startDate: "", endDate: "" });
  };

  const renderBarChart = () => {
    // Create scales
    const xScale = d3.scaleBand()
      .domain(groupedByField.map(d => d.label))
      .range([0, CHART_WIDTH])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(groupedByField, d => d.count)])
      .range([CHART_HEIGHT, 0])
      .nice();

    return (
      <svg width={WIDTH} height={HEIGHT} ref={barRef} className="mx-auto">
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* Grid lines */}
          {yScale.ticks(5).map(tick => (
            <g key={tick} className="text-slate-600">
              <line
                x1={0}
                x2={CHART_WIDTH}
                y1={yScale(tick)}
                y2={yScale(tick)}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
              <text x={-10} y={yScale(tick)} dy="0.32em" textAnchor="end" fill="currentColor" fontSize={12}>
                {tick}
              </text>
            </g>
          ))}

          {/* Bars */}
          {groupedByField.map((d, i) => (
            <g
              key={i}
              transform={`translate(${xScale(d.label)}, 0)`}
              onMouseEnter={(e) => {
                setTooltip({
                  show: true,
                  content: `${d.label === "Unknown" ? "Unknown Group" : d.label}: ${d.count} records`,
                  x: e.clientX,
                  y: e.clientY
                });
              }}
              onMouseLeave={() => setTooltip({ show: false })}
            >
              <rect
                x={0}
                y={yScale(d.count)}
                width={xScale.bandwidth()}
                height={CHART_HEIGHT - yScale(d.count)}
                fill="#3b82f6"
                rx={4}
                className="transition-all duration-200 hover:fill-blue-400"
              />
              <text
                x={xScale.bandwidth() / 2}
                y={yScale(d.count) - 5}
                fontSize="12"
                fill="#fff"
                textAnchor="middle"
              >
                {d.count}
              </text>
            </g>
          ))}

          {/* X-axis */}
          <g transform={`translate(0, ${CHART_HEIGHT})`}>
            {groupedByField.map((d) => (
              <text
                key={d.label}
                x={xScale(d.label) + xScale.bandwidth() / 2}
                y={25}
                textAnchor="middle"
                fill="#ddd"
                fontSize={12}
              >
                {d.label}
              </text>
            ))}
          </g>

          {/* Y-axis label */}
          <text
            transform="rotate(-90)"
            y={-MARGIN.left}
            x={-CHART_HEIGHT / 2}
            dy="1em"
            textAnchor="middle"
            fill="#ddd"
            fontSize={12}
          >
            Number of Records
          </text>
        </g>
      </svg>
    );
  };

  const renderLineChart = () => {
    // Create scales
    const xScale = d3.scalePoint()
      .domain(groupedByDate.map(d => d.year))
      .range([0, CHART_WIDTH])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(groupedByDate, d => d.count)])
      .range([CHART_HEIGHT, 0])
      .nice();

    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    return (
      <svg width={WIDTH} height={HEIGHT} ref={lineRef} className="mx-auto">
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* Grid lines */}
          {yScale.ticks(5).map(tick => (
            <g key={tick} className="text-slate-600">
              <line
                x1={0}
                x2={CHART_WIDTH}
                y1={yScale(tick)}
                y2={yScale(tick)}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
              <text x={-10} y={yScale(tick)} dy="0.32em" textAnchor="end" fill="currentColor" fontSize={12}>
                {tick}
              </text>
            </g>
          ))}

          {/* Line path */}
          <path
            d={line(groupedByDate.sort((a, b) => a.year - b.year))}
            fill="none"
            stroke="#34d399"
            strokeWidth={3}
            className="transition-all duration-200"
          />

          {/* Data points */}
          {groupedByDate.sort((a, b) => a.year - b.year).map((d) => (
            <g
              key={d.year}
              onMouseEnter={(e) => {
                setTooltip({
                  show: true,
                  content: `${d.year}: ${d.count} records`,
                  x: e.clientX,
                  y: e.clientY
                });
              }}
              onMouseLeave={() => setTooltip({ show: false })}
            >
              <circle
                cx={xScale(d.year)}
                cy={yScale(d.count)}
                r={6}
                fill="#34d399"
                stroke="#fff"
                strokeWidth={2}
                className="transition-all duration-200 hover:r-8"
              />
              <text
                x={xScale(d.year)}
                y={yScale(d.count) - 15}
                fontSize="12"
                fill="#fff"
                textAnchor="middle"
              >
                {d.count}
              </text>
            </g>
          ))}

          {/* X-axis */}
          <g transform={`translate(0, ${CHART_HEIGHT})`}>
            {groupedByDate.map((d) => (
              <text
                key={d.year}
                x={xScale(d.year)}
                y={25}
                textAnchor="middle"
                fill="#ddd"
                fontSize={12}
              >
                {d.year}
              </text>
            ))}
          </g>

          {/* Y-axis label */}
          <text
            transform="rotate(-90)"
            y={-MARGIN.left}
            x={-CHART_HEIGHT / 2}
            dy="1em"
            textAnchor="middle"
            fill="#ddd"
            fontSize={12}
          >
            Number of Records
          </text>
        </g>
      </svg>
    );
  };

  const renderFilters = () => (
    <div className="flex flex-wrap gap-4 mb-8 items-center justify-center bg-slate-700 p-6 rounded-xl shadow-lg">
      <div className="text-sm font-medium">Group Field:</div>
      <select
        value={groupField}
        onChange={e => setGroupField(e.target.value)}
        className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white"
      >
        {availableFields.map(field => (
          <option key={field} value={field}>{field}</option>
        ))}
      </select>

      <div className="text-sm font-medium">Year:</div>
      <select
        value={filter.year}
        onChange={e => setFilter(f => ({ ...f, year: e.target.value }))}
        className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white"
      >
        <option value="">All Years</option>
        {uniqueYears.map(y => <option key={y}>{y}</option>)}
      </select>

      <div className="text-sm font-medium">Field Value:</div>
      <select
        value={filter.fieldValue}
        onChange={e => setFilter(f => ({ ...f, fieldValue: e.target.value }))}
        className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white"
      >
        <option value="">All Values</option>
        {uniqueValues.map(v => <option key={v}>{v}</option>)}
      </select>

      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">Date Range:</div>
        <input
          type="date"
          value={filter.startDate || ''}
          onChange={(e) => setFilter(f => ({ ...f, startDate: e.target.value }))}
          className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white"
        />
        <span>to</span>
        <input
          type="date"
          value={filter.endDate || ''}
          onChange={(e) => setFilter(f => ({ ...f, endDate: e.target.value }))}
          className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white"
        />
      </div>

      <button
        onClick={handleReset}
        className="flex items-center gap-1 rounded px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm border border-slate-500"
      >
        <RotateCcw size={16} /> Reset
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-1 rounded px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm shadow"
      >
        <Download size={16} /> Export
      </button>
    </div>
  );

  return (
    <div className="mt-10 min-h-screen bg-gradient-to-br from-slate-900 to-gray-800 text-white flex flex-col items-center px-6 py-10">
      <h2 className="text-4xl font-extrabold mb-6 text-center text-blue-400">
        📊 Interactive Data Dashboard
      </h2>
      {renderFilters()}

      {/* Bar Chart */}
      <div className="bg-slate-800 shadow-lg rounded-2xl p-6 w-full max-w-4xl">
        <h3 className="text-xl font-semibold mb-4 text-center text-blue-300">
          📦 Records by {groupField}
        </h3>
        {renderBarChart()}
      </div>

      {/* Line Chart */}
      <div className="bg-slate-800 shadow-lg rounded-2xl p-6 mt-10 w-full max-w-4xl">
        <h3 className="text-xl font-semibold mb-4 text-center text-green-300">
          📈 Records Over Time
        </h3>
        {renderLineChart()}
      </div>

      {/* Tooltip */}
      {tooltip.show && (
        <div 
          className="fixed bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
