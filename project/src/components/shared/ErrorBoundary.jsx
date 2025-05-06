import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // سجل الخطأ في الكونسول أو أرسله لسيرفر مراقبة الأخطاء
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: "red" }}>
          <h1>حدث خطأ غير متوقع في النظام</h1>
          <pre style={{ textAlign: "left", direction: "ltr", margin: "auto", maxWidth: 600 }}>
            {this.state.error && this.state.error.toString()}
            {"\n"}
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
