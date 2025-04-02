// Dynamic form that:
// - Lets user select field/value
// - Auto-detects operator
// - Supports optional source filtering (A/B/All)
// - Submits filters to backend


import { useState, useEffect } from "react";

const defaultOperators = {
  string: "in",
  number: "between",
  date: "between"
};

const detectFieldType = (value) => {
  if (!isNaN(Number(value))) return "number";
  if (/\d{4}-\d{2}-\d{2}/.test(value)) return "date";
  return "string";
};

const TaskForm = ({ onTaskCreated }) => {
  const [filters, setFilters] = useState([]);
  const [currentField, setCurrentField] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [currentSource, setCurrentSource] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [availableFields, setAvailableFields] = useState([]);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/fields');
        const data = await response.json();
        if (data.status === 'success') {
          const allFields = [...new Set([
            ...data.data.source_a,
            ...data.data.source_b
          ])];
          setAvailableFields(allFields);
        } else {
          console.error('Failed to fetch fields:', data.message);
        }
      } catch (error) {
        console.error('Error fetching fields:', error);
      }
    };

    fetchFields();
  }, []);

  const handleAddFilter = () => {
    const exampleValue = currentValue.includes(",")
      ? currentValue.split(",")[0]
      : currentValue;
    const type = detectFieldType(exampleValue);
    const operator = defaultOperators[type] || "=";

    if (currentField && currentValue) {
      const newFilter = {
        field: currentField,
        operator,
        value: currentValue
      };
      if (currentSource) newFilter.source = currentSource;

      const updatedFilters = [...filters];
      if (editIndex !== null) {
        updatedFilters[editIndex] = newFilter;
        setEditIndex(null);
      } else {
        updatedFilters.push(newFilter);
      }

      setFilters(updatedFilters);
      setCurrentField("");
      setCurrentValue("");
      setCurrentSource("");
    }
  };

  const handleEdit = (index) => {
    const f = filters[index];
    setCurrentField(f.field);
    setCurrentValue(f.value);
    setCurrentSource(f.source || "");
    setEditIndex(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("http://127.0.0.1:8000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters })
    });
    const data = await response.json();
    onTaskCreated(data.task_id);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl w-full mx-auto mt-10 p-6 bg-slate-800 rounded-xl shadow-md text-white">
      {filters.map((filter, idx) => (
        <div key={idx} className="text-sm flex justify-between items-center bg-slate-700 px-3 py-2 mb-2 rounded">
          <span>
            {filter.field} {filter.operator} {filter.value} {filter.source && `(Source ${filter.source})`}
          </span>
          <button
            type="button"
            onClick={() => handleEdit(idx)}
            className="text-blue-300 hover:text-blue-500 text-xs underline"
          >
            Edit
          </button>
        </div>
      ))}

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select value={currentField} onChange={e => setCurrentField(e.target.value)} className="bg-slate-700 border border-slate-600 text-white p-2 rounded">
          <option value="">Select Field</option>
          {availableFields.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <input
          placeholder="Enter value(s)"
          className="bg-slate-700 border border-slate-600 text-white p-2 rounded flex-1"
          value={currentValue}
          onChange={e => setCurrentValue(e.target.value)}
        />

        <select value={currentSource} onChange={e => setCurrentSource(e.target.value)} className="bg-slate-700 border border-slate-600 text-white p-2 rounded">
          <option value="">All Sources</option>
          <option value="A">Source A</option>
          <option value="B">Source B</option>
        </select>

        <button
          type="button"
          onClick={handleAddFilter}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {editIndex !== null ? "Update Filter" : "Add Filter"}
        </button>
      </div>

      <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded w-full mt-4 text-lg font-medium">Submit Task</button>
    </form>
  );
};

export default TaskForm;
