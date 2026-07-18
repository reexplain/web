"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PracticeExcerpt } from "@/types/dashboard";

const Reorder = ({ excerpts }: { excerpts: PracticeExcerpt[] }) => {
  const orderedExcerpts = [...excerpts].sort((left, right) => left.sequence - right.sequence);
  const [items, setItems] = useState(() => [...orderedExcerpts].reverse());
  const isCorrect = items.every((item, index) => item.id === orderedExcerpts[index].id);

  const moveItem = (index: number, direction: -1 | 1) => {
    const destination = index + direction;

    if (destination < 0 || destination >= items.length) return;

    setItems((current) => {
      const nextItems = [...current];
      [nextItems[index], nextItems[destination]] = [nextItems[destination], nextItems[index]];
      return nextItems;
    });
  };

  return (
    <Card className="grid h-96 grid-rows-[auto_1fr_auto] gap-4">
      <CardHeader className="gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
          Reorder
        </p>
        <CardTitle className="font-secondary text-xl font-medium">Build the explanation in a logical sequence</CardTitle>
      </CardHeader>
      <CardContent
        aria-label="Reorder steps"
        className="min-h-0 overflow-y-auto"
        role="region"
        tabIndex={0}
      >
        <ol className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li className="flex items-center gap-2 border p-2" key={item.id}>
              <span className="line-clamp-2 min-w-0 flex-1 text-sm leading-5">{item.excerpt}</span>
              <div className="flex gap-1">
                <Button
                  aria-label={`Move step ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  ↑
                </Button>
                <Button
                  aria-label={`Move step ${index + 1} down`}
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  ↓
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="min-h-10">
        {isCorrect ? <p className="text-emerald-600" role="status">Correct order.</p> : null}
      </CardFooter>
    </Card>
  );
};

export default Reorder;
