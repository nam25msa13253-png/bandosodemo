"use client";
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary mt-4 no-print">
      In tem
    </button>
  );
}
