import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "發生了未預期的錯誤。";
      let errorDetail = "";

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && (parsed.error.includes("insufficient permissions") || parsed.error.includes("Missing or insufficient permissions"))) {
            errorMessage = "權限不足，無法執行此操作。";
            errorDetail = `操作：${parsed.operationType}，路徑：${parsed.path}`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        if (this.state.error?.message.includes("insufficient permissions")) {
          errorMessage = "權限不足，無法執行此操作。";
        }
      }

      return (
        <div className="min-h-screen bg-[#E4E3E0] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-8">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-4xl font-serif italic mb-4">{errorMessage}</h1>
          {errorDetail && <p className="text-gray-500 mb-8 font-mono text-sm">{errorDetail}</p>}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-8 py-4 bg-[#141414] text-white rounded-full hover:scale-105 transition-transform font-sans font-medium"
          >
            <RefreshCw size={20} />
            重新整理頁面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
