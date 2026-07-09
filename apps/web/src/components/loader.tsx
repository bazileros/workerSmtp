import { DotmSquare3 } from "@workerSmtp/ui/components/ui/dotm-square-3";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center pt-8">
      <DotmSquare3 size={40} dotSize={5} animated speed={1} />
    </div>
  );
}
