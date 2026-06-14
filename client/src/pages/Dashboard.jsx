import { useParams } from "react-router-dom";

export default function Dashboard() {
  const { id } = useParams();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <p className="text-white text-sm">
        Error dashboard for project{" "}
        <span className="text-indigo-400 font-mono">{id}</span> — coming Day 8
      </p>
    </div>
  );
}
