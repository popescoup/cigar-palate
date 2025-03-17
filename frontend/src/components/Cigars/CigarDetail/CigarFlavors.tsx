import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, QueryClient } from '@tanstack/react-query';
import { api } from '@/utils/axiosConfig';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { User } from '@/types/user';
import type { FlavorRanking } from '@/types/cigars';

interface CigarFlavorsProps {
  flavorRankings: FlavorRanking[];
  currentUser: User | null;
  queryClient: QueryClient;
  cigarId: string;
}

const COLORS = [
  '#475569', // slate-600
  '#64748b', // slate-500
  '#6b7280', // gray-500
  '#71717a', // zinc-500
  '#737373', // neutral-500
  '#78716c', // stone-500
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#14b8a6', // teal-500
  '#8b5cf6', // violet-500
];

// Custom legend component with more explicit text wrapping
const CustomLegend = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  return (
    <div className="flex flex-col gap-3">
      {data.map((entry, index) => (
        <div key={`legend-item-${index}`} className="flex items-start">
          <div 
            className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0 rounded-sm" 
            style={{ backgroundColor: entry.color }}
          />
          <div 
            className="max-w-20 overflow-hidden text-base" 
            style={{
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              hyphens: 'auto',
              lineHeight: '1.3rem'
            }}
          >
            {entry.name}
          </div>
        </div>
      ))}
    </div>
  );
};

const CigarFlavors: React.FC<CigarFlavorsProps> = ({
  flavorRankings = [], // Add default empty array
  currentUser,
  queryClient,
  cigarId,
}) => {
  // Add validation
  const validFlavorRankings = useMemo(() => {
    if (!Array.isArray(flavorRankings)) return [];
    return flavorRankings.filter(ranking => 
      ranking && 
      typeof ranking.flavor === 'string' && 
      typeof ranking.averageRank === 'number'
    );
  }, [flavorRankings]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userRankings, setUserRankings] = useState<Record<string, number>>({});
  const [resetKey, setResetKey] = useState(0);

  // Check if user has already ranked
  const {
    data: userFlavorRankingStatus
  } = useQuery({
    queryKey: ['userFlavorRankingStatus', cigarId],
    queryFn: async () => {
      const { data } = await api.get(`/api/cigars/${cigarId}/flavor-rankings/check`);
      return data;
    },
    enabled: !!cigarId && !!currentUser,
    retry: 1
  });

  const hasRanked = userFlavorRankingStatus?.hasRanked || false;

  // Get all possible rank values (1 to number of flavors)
  const possibleRanks = useMemo(() => 
    Array.from({ length: validFlavorRankings.length || 0 }, (_, i) => i + 1),
    [validFlavorRankings.length]
  );

  // Get currently used ranks
  const usedRanks = useMemo(() => 
    Object.values(userRankings),
    [userRankings]
  );

  // Get available ranks for selection
  const getAvailableRanks = (currentFlavor: string) => {
    const currentRank = userRankings[currentFlavor];
    return possibleRanks.filter(rank => 
      !usedRanks.includes(rank) || rank === currentRank
    );
  };

  const areAllFlavorsRanked = useMemo(() => 
    validFlavorRankings.length > 0 && 
    validFlavorRankings.every(item => userRankings[item.flavor] !== undefined),
    [validFlavorRankings, userRankings]
  );

  // Prepare data for pie chart with emphasized differences
  const pieData = useMemo(() => {
    if (!validFlavorRankings.length) return [];
  
    const values = validFlavorRankings.map(item => ({
      name: item.flavor,
      rawValue: Math.pow(2, (10 - item.averageRank))
    }));
  
    const total = values.reduce((sum, item) => sum + item.rawValue, 0);
    if (total === 0) return [];
  
    return values
      .sort((a, b) => b.rawValue - a.rawValue)
      .map(item => ({
        name: item.name,
        value: (item.rawValue / total) * 100
      }));
  }, [validFlavorRankings]);

  // Prepare data for custom legend including colors
  const legendData = useMemo(() => {
    return pieData.map((entry, index) => ({
      name: entry.name,
      value: entry.value,
      color: COLORS[index % COLORS.length]
    }));
  }, [pieData]);

  const flavorRankingMutation = useMutation({
    mutationFn: async (rankings: { flavor: string, rank: number | null }[]) => {
      const validRankings = rankings
        .filter(item => item.rank !== null)
        .map(item => ({ flavor: item.flavor, rank: item.rank }));
      
      await api.post(`/api/cigars/${cigarId}/flavor-rankings`, { 
        rankings: validRankings 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flavorRankings', cigarId] });
      queryClient.invalidateQueries({ queryKey: ['userFlavorRankingStatus', cigarId] });
      setUserRankings({});
      setResetKey(prev => prev + 1);
    },
    onError: () => {
      alert('Failed to submit flavor rankings');
    }
  });

  const handleRankChange = (flavor: string, newRank: string | null) => {
    setUserRankings(prev => {
      if (newRank === null) {
        const { [flavor]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [flavor]: parseInt(newRank)
      };
    });
  };

  const handleSubmit = () => {
    if (!areAllFlavorsRanked) {
      alert('Please rank all flavors before submitting');
      return;
    }

    const rankings = validFlavorRankings.map(item => ({
      flavor: item.flavor,
      rank: userRankings[item.flavor] || null
    }));
    flavorRankingMutation.mutate(rankings);
  };

  if (!validFlavorRankings.length) {
    return (
      <section className="border-t border-gray-200 pt-6">
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No flavor data available</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`border-t border-gray-200 pt-6 ${isExpanded ? 'mt-4' : ''}`}>
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
        <h2 className="text-xl sm:text-2xl font-light text-gray-900">Flavor Profile</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isExpanded 
              ? "" 
              : "Click to rate flavors"}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-6 w-6 text-gray-500" />
        ) : (
          <ChevronDown className="h-6 w-6 text-gray-500" />
        )}
      </div>

      {/* Pie Chart and Legend Section - Always visible */}
      {pieData.length > 0 && (
      <div className="mt-1 mb-1 h-[200px] sm:h-[250px]">
        <div className="flex h-full">
          <div className="w-3/5 h-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-2/5 pl-6 flex items-center">
            <CustomLegend data={legendData} />
          </div>
        </div>
      </div>
      )}

      {/* Message when collapsed */}
      {!isExpanded && (
        <p className="text-sm text-gray-500 text-center mt-4">
          {currentUser 
            ? hasRanked 
              ? "You've already ranked this cigar's flavors"
              : "Click to expand and rank flavors by their prominence"
            : "Log in to rate flavors"}
        </p>
      )}

      {/* Expandable Section */}
      {isExpanded && (
        <div className="space-y-6 mt-6">
          {/* Ranking instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Rank each flavor based on its prominence in the cigar.
              Lower rankings indicate greater prominence.
            </p>
          </div>

          {/* Table section */}
          <div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500 pb-2">Flavor</th>
                  <th className="text-left text-sm font-medium text-gray-500 pb-2">Average Rank</th>
                  <th className="text-left text-sm font-medium text-gray-500 pb-2">Your Rank</th>
                </tr>
              </thead>
              <tbody>
                {validFlavorRankings
                  .sort((a, b) => a.averageRank - b.averageRank)
                  .map((item) => (
                    <tr key={item.flavor} className="border-t">
                      <td className="py-3">{item.flavor}</td>
                      <td className="py-3">{item.averageRank.toFixed(2)}</td>
                      <td className="py-3">
                        <Select
                          key={`${item.flavor}-${resetKey}`}
                          value={userRankings[item.flavor]?.toString()}
                          onValueChange={(value: string) => 
                            handleRankChange(item.flavor, value === "Rank" ? null : value)
                          }
                          disabled={!currentUser || hasRanked}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Rank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rank">Rank</SelectItem>
                            {possibleRanks.map(rank => (
                              <SelectItem 
                                key={rank} 
                                value={rank.toString()}
                                disabled={!getAvailableRanks(item.flavor).includes(rank)}
                                className={
                                  usedRanks.includes(rank) && 
                                  userRankings[item.flavor] !== rank 
                                    ? "text-gray-400" 
                                    : ""
                                }
                              >
                                {rank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={!currentUser || !areAllFlavorsRanked || flavorRankingMutation.isPending || hasRanked}
            >
              {hasRanked ? 'Already Ranked' : 'Submit Rankings'}
            </Button>
          </div>

          {!currentUser && (
            <p className="text-sm text-gray-500 text-center">
              Please log in to submit flavor rankings
            </p>
          )}
          {!areAllFlavorsRanked && currentUser && !hasRanked && (
            <p className="text-sm text-gray-500 text-center">
              Please rank all flavors before submitting
            </p>
          )}
          {hasRanked && (
            <p className="text-sm text-gray-500 text-center">
              You have already submitted rankings for this cigar
            </p>
          )}
          {flavorRankingMutation.isError && (
            <p className="text-sm text-red-500 text-center">
              Failed to submit rankings. Please try again.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default CigarFlavors;