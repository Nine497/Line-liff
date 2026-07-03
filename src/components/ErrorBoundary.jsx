import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-lg font-semibold">เกิดข้อผิดพลาดที่ไม่คาดคิด</p>
          <p className="text-sm text-muted-foreground">
            กรุณาปิดและเปิดแอปใหม่อีกครั้ง
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
