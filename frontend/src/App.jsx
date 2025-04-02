// App shell to manage task state and display TaskForm + Charts

import { useState } from "react";
import TaskForm from "./components/TaskForm";
import SalesByCompany from "./charts/SalesByCompany";

export default function App() {
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState("pending");
  const [records, setRecords] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);

  const checkStatus = async (id) => {
    const res = await fetch(`http://127.0.0.1:8000/tasks/${id}/status`);
    const data = await res.json();
    if (data.status === "completed") {
      const recRes = await fetch(`http://127.0.0.1:8000/tasks/${id}/data`);
      const recData = await recRes.json();
      setRecords(recData.records);
      setTaskStatus("completed");

      if (recData.records.length > 0) {
        const sample = recData.records[0];
        const dynamicFields = Object.keys(sample).map((key) => {
          const val = sample[key];
          let type = typeof val;
          if (type === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) type = "date";
          else if (type === "number") type = "number";
          else type = "string";
          return { name: key, type };
        });
        setAvailableFields(dynamicFields);
      }
    } else {
      setTimeout(() => checkStatus(id), 2000);
    }
  };

  const handleTaskCreated = (id) => {
    setTaskId(id);
    setTaskStatus("pending");
    checkStatus(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-800">
          <h1 className="text-5xl font-extrabold text-center text-white mb-2">Create Data Fetch Task</h1>
          <TaskForm onTaskCreated={handleTaskCreated} availableFields={availableFields} />
        </div>

        {taskStatus === "completed" && (
          <div className="mt-12">
            <SalesByCompany records={records} />
          </div>
        )}
      </div>
    </div>
  );
}

