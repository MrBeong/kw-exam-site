args <- commandArgs(trailingOnly = TRUE)
out <- args[1]
checks <- character()
verify <- function(ok, label) {
  stopifnot(isTRUE(ok))
  checks <<- c(checks, label)
}
verify(identical(5 == 5, TRUE), "equality")
verify(identical(5 != 5, FALSE), "inequality")
verify(identical(5 <= 5, TRUE), "less/equal boundary")
verify(identical(5 >= 5, TRUE), "greater/equal boundary")
verify(identical(!TRUE, FALSE), "negation")
verify(identical(TRUE | FALSE, TRUE), "elementwise OR")
verify(identical(TRUE & FALSE, FALSE), "elementwise AND")
verify(identical(c(TRUE, FALSE) | c(FALSE, FALSE), c(TRUE, FALSE)), "vector OR")
verify(identical(c(TRUE, FALSE) & c(FALSE, TRUE), c(FALSE, FALSE)), "vector AND")
x <- 3
x <- 5
verify(identical(x, 5), "assignment overwrite")
x <- NULL
verify(is.null(x) && exists("x") && !identical(x, 0), "NULL is not zero or removal")
a <- c(2, 4, 6)
verify(mean(a) == 4 && median(a) == 4, "location functions")
verify(var(a) == 4 && sd(a) == 2, "sample variance/SD")
verify(identical(unname(quantile(a)), c(2, 3, 4, 5, 6)), "default quantiles")
verify(identical(as.numeric(summary(a)[3]), median(a)), "summary median")
fit <- lm(c(2, 3, 7) ~ c(1, 2, 3))
co <- summary(fit)$coefficients
verify(identical(colnames(co), c("Estimate", "Std. Error", "t value", "Pr(>|t|)")), "coefficient table labels")
verify(isTRUE(all.equal(unname(co[, 1] / co[, 2]), unname(co[, 3]))), "t statistic ratio")
verify(identical(names(quantile(residuals(fit))), c("0%", "25%", "50%", "75%", "100%")), "residual five quantiles")
styles <- c("blank", "solid", "dashed", "dotted", "dotdash", "longdash", "twodash")
draw <- function(file, style) {
  png(file, width = 600, height = 120)
  par(mar = c(0, 0, 0, 0))
  plot.new()
  plot.window(xlim = c(0, 1), ylim = c(0, 1))
  segments(0.1, 0.5, 0.9, 0.5, lty = style, lwd = 2)
  dev.off()
}
td <- tempfile("recall-lines-")
dir.create(td)
for (i in 0:6) {
  f1 <- file.path(td, paste0(i, "-numeric.png"))
  f2 <- file.path(td, paste0(i, "-name.png"))
  draw(f1, i)
  draw(f2, styles[i + 1])
  verify(identical(unname(tools::md5sum(f1)), unname(tools::md5sum(f2))), paste0("lty ", i, " = ", styles[i + 1], ": identical rendered pixels"))
}
jsonlite::write_json(list(status = "pass", R = R.version.string, checksPassed = length(checks), checks = checks), out, pretty = TRUE, auto_unbox = TRUE)
cat(length(checks), "R recall checks passed\n")
