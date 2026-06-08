import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { PulseLoader } from "react-spinners";
import { Button } from "@/components/ui/button";

export function SpinnerEmpty({ title, description }) {
    return (
        <Empty className="w-full">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <PulseLoader size={20} />
                </EmptyMedia>

                <EmptyTitle>
                    {title || "Processing your request"}
                </EmptyTitle>

                <EmptyDescription>
                    {description ||
                        "Please wait while we process your request. Do not refresh the page."}
                </EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
                <Button variant="outline" size="sm">
                    Cancel
                </Button>
            </EmptyContent>
        </Empty>
    );
}