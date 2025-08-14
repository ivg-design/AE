export interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    input: string;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
  border: {
    primary: string;
    focus: string;
  };
}

export interface ThemeTypography {
  fontFamily: {
    primary: string;
    monospace: string;
  };
  fontSize: {
    small: string;
    medium: string;
    large: string;
  };
  fontWeight: {
    normal: number;
    bold: number;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: {
    small: string;
    medium: string;
  };
}

export const defaultTheme: Theme = {
  colors: {
    background: {
      primary: "#232323",
      secondary: "#000000",
      input: "#333333"
    },
    text: {
      primary: "#ffffff",
      secondary: "#666666",
      accent: "#0099ff"
    },
    border: {
      primary: "#444444",
      focus: "#0099ff"
    }
  },
  typography: {
    fontFamily: {
      primary: "Arial, sans-serif",
      monospace: "monospace"
    },
    fontSize: {
      small: "12px",
      medium: "14px",
      large: "24px"
    },
    fontWeight: {
      normal: 400,
      bold: 700
    }
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "10px",
    lg: "16px",
    xl: "24px"
  },
  borderRadius: {
    small: "3px",
    medium: "4px"
  }
}; 