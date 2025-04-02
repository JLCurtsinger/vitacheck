
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

interface SearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function SearchAndFilter({ searchQuery, setSearchQuery }: SearchAndFilterProps) {
  return (
    <div className="flex gap-4 mb-8">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input 
          type="search" 
          placeholder="Search experiences..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          className="pl-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" 
        />
      </div>
      <Button variant="outline" className="border-2 border-gray-200 hover:border-blue-500 hover:bg-white/50">
        <Filter className="mr-2 h-4 w-4" />
        Filter
      </Button>
    </div>
  );
}
