import { Theme } from './theme';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';

// Extend CSSProperties to include WebkitAppRegion
interface ExtendedCSSProperties extends CSSProperties {
  WebkitAppRegion?: 'drag' | 'no-drag';
}

// Create a hook for memoized styles
export const useStyles = (theme: Theme) => useMemo(() => createStyles(theme), [theme]);

// Keep createStyles for direct usage if needed
export const createStyles = (theme: Theme): Record<string, ExtendedCSSProperties> => ({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "0",
    margin: "0",
    backgroundColor: theme.colors.background.primary,
    height: "46px",
    width: "125px",
    minWidth: "125px",
    maxWidth: "125px",
    minHeight: "46px",
    maxHeight: "46px",
    boxSizing: "border-box",
    color: theme.colors.text.primary,
    WebkitAppRegion: "drag",
    overflow: "hidden",
    position: "fixed" as const,
    top: "0",
    left: "0",
  },
  frameInput: {
    width: "125px",
    height: "24px",
    fontSize: theme.typography.fontSize.medium,
    fontWeight: theme.typography.fontWeight.bold,
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.focus}`,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.xs,
    textAlign: "center",
    marginBottom: "2px",
    outlineColor: theme.colors.border.focus,
    WebkitAppRegion: "no-drag",
    boxSizing: "border-box",
  },
  statusText: {
    fontSize: "10px",
    color: theme.colors.text.accent,
    margin: "0",
    padding: "0",
    fontFamily: theme.typography.fontFamily.monospace,
    textAlign: "center",
    WebkitAppRegion: "no-drag",
    height: "16px",
    lineHeight: "16px",
    width: "100%",
    boxSizing: "border-box",
  },
  input: {
    backgroundColor: theme.colors.background.input,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.xs,
    fontSize: theme.typography.fontSize.medium,
    outline: "none",
    WebkitAppRegion: "no-drag",
    boxSizing: "border-box",
  },
  button: {
    cursor: "pointer",
    WebkitAppRegion: "no-drag",
    color: theme.colors.text.primary,
  }
}); 