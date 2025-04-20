
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/6">Source</TableHead>
            <TableHead className="text-right">Total Cases</TableHead>
            <TableHead className="text-right text-red-700">Severe Cases</TableHead>
            <TableHead className="text-right text-yellow-700">Moderate Cases</TableHead>
            <TableHead className="text-right text-green-700">Minor Cases</TableHead>
            <TableHead className="text-right">% Severe</TableHead>
            <TableHead className="w-1/5">Distribution</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allStats.map((stat, index) => {
            const isCombined = stat.name === "Final Combined Rating";
            const clickableRow = !isCombined && validSources.some(vs => vs.name === stat.name);
            return (
              <tr
                key={index}
                className={
                  "group"
                  + (clickableRow ? " cursor-pointer hover:bg-blue-50 transition" : "")
                }
                onClick={() => clickableRow && onRowClick(stat.name)}
                tabIndex={clickableRow ? 0 : undefined}
              >
                <SeverityTableRow
                  stat={stat}
                  isCombined={isCombined}
                />
              </tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
