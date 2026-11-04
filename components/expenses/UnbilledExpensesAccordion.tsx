"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetUnbilledExpensesQuery } from "@/lib/services/api";
import { UnbilledExpenseItem } from "@/lib/types/expenses";
import {
  Receipt,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Sparkles,
} from "lucide-react";

interface UnbilledExpensesAccordionProps {
  clientId: string;
  alreadyAddedExpenseIds: string[];
  onAddExpense: (expense: UnbilledExpenseItem) => void;
  onAddAllExpenses?: (expenses: UnbilledExpenseItem[]) => void;
}

export function UnbilledExpensesAccordion({
  clientId,
  alreadyAddedExpenseIds,
  onAddExpense,
  onAddAllExpenses,
}: UnbilledExpensesAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const { data, isLoading } = useGetUnbilledExpensesQuery(clientId, {
    skip: !clientId,
  });

  const unbilledExpenses = data?.unbilledExpenses || [];
  const totalAmount = data?.totalUnbilledExpensesAmount || 0;

  if (!clientId || (!isLoading && unbilledExpenses.length === 0)) {
    return null;
  }

  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const remainingToAdd = unbilledExpenses.filter(
    (exp) => !alreadyAddedExpenseIds.includes(exp._id),
  );

  return (
    <div className="rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-3.5 flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="h-7 w-7 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                Unbilled Client Outlays & Reimbursables
              </span>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                {unbilledExpenses.length} Available •{" "}
                {formatCurrency(totalAmount)}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Statutory challans, filing fees, and out-of-pocket costs ready to
              bill
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {remainingToAdd.length > 1 && onAddAllExpenses && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddAllExpenses(remainingToAdd)}
              className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <Sparkles className="h-3 w-3" />
              <span>Add All ({remainingToAdd.length})</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible List */}
      {isOpen && (
        <div className="p-3 pt-0 border-t border-emerald-500/20 divide-y divide-emerald-500/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-3">
            {unbilledExpenses.map((exp) => {
              const alreadyAdded = alreadyAddedExpenseIds.includes(exp._id);

              return (
                <div
                  key={exp._id}
                  className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between gap-2 ${
                    alreadyAdded
                      ? "bg-muted/40 border-border/50 opacity-75"
                      : "bg-card border-border hover:border-emerald-500/40 shadow-xs"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">
                        {exp.expenseNo}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {formatCurrency(exp.amount)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                      {exp.categoryName}
                    </p>

                    {exp.notes && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                        {exp.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/40">
                    <span>
                      {new Date(exp.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>

                    {alreadyAdded ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <Check className="h-3 w-3" /> Added
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onAddExpense(exp)}
                        className="h-6 px-2 text-[10px] gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium"
                      >
                        <Plus className="h-3 w-3" /> Add to Invoice
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
