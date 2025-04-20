
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeverityTableRow } from "../severity/SeverityTableRow";

interface SeverityBreakdownTableProps {
  allStats: Array<any>;
  validSources: Array<any>;
  onRowClick: (statName: string) => void;
}

export function SeverityBreakdownTable({
  allStats,
  validSources,
  onRowClick
}: SeverityBreakdownTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-gray-200">
            <TableHead className="w-1/6 whitespace-nowrap">Source</TableHead>
            <TableHead className="text-right whitespace-nowrap">Total Cases</TableHead>
            <TableHead className="text-right text-red-700 whitespace-nowrap">Severe Cases</TableHead>
            <TableHead className="text-right text-yellow-700 whitespace-nowrap">Moderate Cases</TableHead>
            <TableHead className="text-right text-green-700 whitespace-nowrap">Minor Cases</TableHead>
            <TableHead className="text-right whitespace-nowrap">% Severe</TableHead>
            <TableHead className="w-1/5 whitespace-nowrap">Distribution</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allStats.map((stat, index) => {
            const isCombined = stat.name === "Final Combined Rating";
            const clickableRow = !isCombined && validSources.some(vs => vs.name === stat.name);
            return (
              <TableRow
                key={index}
                className={
                  "group relative" +
                  (clickableRow ? " cursor-pointer hover:bg-blue-50 transition" : "") +
                  (isCombined ? " bg-gray-100" : "")
                }
                onClick={() => clickableRow && onRowClick(stat.name)}
                tabIndex={clickableRow ? 0 : undefined}
              >
                <SeverityTableRow
                  stat={stat}
                  isCombined={isCombined}
                />
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
