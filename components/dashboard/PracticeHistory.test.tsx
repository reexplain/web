import { render, screen } from "@testing-library/react";
import PracticeHistory from "@/components/dashboard/PracticeHistory";
import type { PracticeBatch } from "@/types/dashboard";

jest.mock("@/components/dashboard/PracticeActivityPair", () =>
  function PracticeActivityPairMock({ excerpts }: { excerpts: Array<{ id: string }> }) {
    return <div>Practice pair: {excerpts.map((item) => item.id).join(",")}</div>;
  },
);

const makeBatch = (
  id: string,
  filename: string,
  generatedAt: number,
): PracticeBatch => ({
  id: id as PracticeBatch["id"],
  documentId: `document-${id}` as PracticeBatch["documentId"],
  filename,
  generatedAt,
  excerpts: [{ id: `concept-${id}`, excerpt: `${filename} concept`, sequence: 0 }],
});

describe("PracticeHistory", () => {
  it("renders every generated batch with the newest first", () => {
    render(<PracticeHistory batches={[
      makeBatch("older", "Older notes.pdf", 1_000),
      makeBatch("newest", "Newest notes.pdf", 3_000),
      makeBatch("middle", "Middle notes.pdf", 2_000),
    ]} />);

    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent))
      .toEqual(["Newest notes.pdf", "Middle notes.pdf", "Older notes.pdf"]);
    expect(screen.getByText("Practice pair: concept-newest")).toBeInTheDocument();
    expect(screen.getAllByText("1 learning item")).toHaveLength(3);
  });

  it("caps each session at the number of rendered learning activities", () => {
    render(<PracticeHistory batches={[{
      ...makeBatch("current", "Current notes.pdf", 1_000),
      excerpts: [
        { id: "concept-1", excerpt: "First concept", sequence: 0 },
        { id: "concept-2", excerpt: "Second concept", sequence: 1 },
        { id: "concept-3", excerpt: "Third concept", sequence: 2 },
      ],
    }]} />);

    expect(screen.getByText("2 learning items")).toBeInTheDocument();
  });

  it("shows an empty state when no practice has been generated", () => {
    render(<PracticeHistory batches={[]} />);

    expect(screen.getByText("No practice concepts yet")).toBeInTheDocument();
  });
});
