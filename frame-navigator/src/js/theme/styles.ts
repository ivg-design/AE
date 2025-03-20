import { Theme } from './theme';

export const createStyles = (theme: Theme) => ({
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    margin: 0,
    backgroundColor: theme.colors.background.primary,
    height: "46px",
    width: "125px",
    boxSizing: "border-box" as const,
    color: theme.colors.text.primary,
    WebkitAppRegion: "drag" as const,
    overflow: "hidden",
  },
  frameInput: {
    width: "125px",
    height: "30px",
    fontSize: theme.typography.fontSize.medium,
    fontWeight: theme.typography.fontWeight.bold,
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.focus}`,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.xs,
    textAlign: "center" as const,
    marginBottom: 0,
    outlineColor: theme.colors.border.focus,
    WebkitAppRegion: "no-drag" as const,
  },
  statusText: {
    fontSize: "10px",
    color: theme.colors.text.accent,
    margin: 0,
    padding: 0,
    fontFamily: theme.typography.fontFamily.monospace,
    textAlign: "center" as const,
    WebkitAppRegion: "no-drag" as const,
    height: "16px",
    lineHeight: "16px",
  },
  input: {
    backgroundColor: theme.colors.background.input,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.xs,
    fontSize: theme.typography.fontSize.medium,
    outline: "none",
    WebkitAppRegion: "no-drag" as const,
    "&:focus": {
      borderColor: theme.colors.border.focus,
    }
  },
  button: {
    cursor: "pointer",
    WebkitAppRegion: "no-drag" as const,
    "&:hover": {
      color: theme.colors.text.primary,
    }
  }
}); 