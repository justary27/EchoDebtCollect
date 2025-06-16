import Link from "next/link";

export function Navbar() {
    return (
        <div className="flex items-center px-8 py-4 justify-between bg-white/20">
            <div className="flex items-center gap-8">
                <div className="text-2xl font-bold">DebtCollect</div>
                <div className="flex items-center gap-2">
                    <Link href={'/'}>Dashboard</Link>
                </div>
            </div>
            <div>
                A
            </div>
        </div>
    );
}