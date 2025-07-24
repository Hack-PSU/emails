// src/app/email/SelectionInfo.tsx

interface Props {
  selectedCount: number;
  totalCount: number;
}

export default function SelectionInfo({ selectedCount, totalCount }: Props) {
  return (
    <p className="text-lg text-muted-foreground">
      {selectedCount} of {totalCount} row(s) selected.
    </p>
  );
}
