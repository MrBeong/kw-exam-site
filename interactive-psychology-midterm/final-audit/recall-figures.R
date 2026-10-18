args <- commandArgs(trailingOnly = TRUE)
out <- args[1]
draw_lines <- function(name, styles) {
  svg(file.path(out, paste0(name, ".svg")), width = 7, height = 2.4,
      bg = "white", family = "Apple SD Gothic Neo", pointsize = 12)
  par(mar = c(0.6, 0.5, 0.5, 0.5))
  plot.new()
  plot.window(xlim = c(0, 10), ylim = c(0, 3))
  for (i in seq_along(styles)) {
    text(0.6, 3.5 - i, c("(가)", "(나)", "(다)")[i], cex = 1.2)
    segments(1.7, 3.5 - i, 9.5, 3.5 - i, lty = styles[i], lwd = 2)
  }
  dev.off()
}
draw_lines("recall-lines-a", c(2, 3, 1))
draw_lines("recall-lines-b", c(6, 4, 5))
