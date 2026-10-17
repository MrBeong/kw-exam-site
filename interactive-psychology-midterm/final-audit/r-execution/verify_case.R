args <- commandArgs(trailingOnly = TRUE)
if (nzchar(Sys.getenv("PSY_R_LIBRARY"))) .libPaths(c(Sys.getenv("PSY_R_LIBRARY"), .libPaths()))
library(jsonlite)
q <- fromJSON(args[1], simplifyVector = FALSE)
base <- dirname(normalizePath(args[1]))
code_file <- file.path(base, paste0(q$id, "-answer.R"))
out <- file.path(base, paste0(q$id, "-result.json"))
checks <- character()
check <- function(ok, label) {
  if (!isTRUE(ok)) stop(label)
  checks <<- c(checks, label)
}
near <- function(x, expected, label, tolerance = 1e-8) {
  check(length(x) == length(expected) && all(is.finite(x)) &&
        all(abs(as.numeric(x) - expected) <= tolerance), label)
}
e <- new.env(parent = globalenv())
# Run only the input data visible in each question. Constructed practice data
# are labeled explicitly, and their rounded outputs are checked against the answers.
setup <- function() {
  if (!is.null(q$codeSetup)) eval(parse(text = q$codeSetup), envir = e)
}

warnings <- character()
metrics <- list()
status <- tryCatch({
  plot_file <- file.path(base, paste0(q$id, ".pdf"))
  pdf(plot_file, width = 6, height = 4, compress = FALSE)
  setup()
  parsed <- parse(code_file, keep.source = TRUE)
  values <- list()
  console <- capture.output(withCallingHandlers({
    for (i in seq_along(parsed)) {
      value <- withVisible(eval(parsed[[i]], envir = e))
      values[[i]] <- value$value
      if (value$visible) print(value$value)
    }
  }, warning = function(w) {
    warnings <<- c(warnings, conditionMessage(w)); invokeRestart("muffleWarning")
  }))
  dev.off()
  writeLines(console, file.path(base, paste0(q$id, "-console.txt")))
  if (!q$originId %in% c("RC004", "RC013", "RC014")) unlink(plot_file)
  check(length(parsed) > 0, "completed answer parses and evaluates in real R")
  switch(q$originId,
    RC001 = {
      near(e$ascending, sort(e$score), "ascending vector")
      near(e$ordered, rev(e$ascending), "descending vector")
      expected <- if (q$id == "ME1-Q29") 90 else 80
      near(tail(values, 1)[[1]], expected, "printed maximum matches answer/rubric")
      metrics <- list(ascending = e$ascending, ordered = e$ordered, output = expected)
    },
    RC002 = {
      expected <- c(1, 100, 22, 3)
      near(unlist(values[2:5]), expected, "four visible summary values match answer/rubric")
      metrics <- list(output = expected)
    },
    RC003 = {
      near(c(e$v, e$s), c(4, 2), "variance and SD match answer/rubric")
      near(sum((e$a - mean(e$a))^2) / e$v, 2, "sample variance denominator n-1")
      metrics <- list(variance = e$v, SD = e$s, denominator = 2)
    },
    RC004 = {
      near(values[[1]], c(1, 2, 3, 4, 100), "default quantiles at five percentages")
      check(identical(names(values[[1]]), c("0%", "25%", "50%", "75%", "100%")), "quantile labels")
      check(values[[2]]$n == 5 && inherits(values[[3]], "table"), "boxplot observes five values; data-frame summary returned")
      check(file.info(plot_file)$size > 1000, "actual boxplot PDF rendered")
      metrics <- list(quantiles = values[[1]], boxplotN = values[[2]]$n)
    },
    RC005 = {
      near(values[[1]], 80, "case-sensitive sort/TRUE and one-based index")
      metrics <- list(fixtureMaximum = values[[1]])
    },
    RC006 = {
      check(inherits(values[[1]], "htest") && grepl("Shapiro", values[[1]]$method), "Shapiro-Wilk test executed")
      near(round(values[[1]]$p.value, 2), .08, "actual Shapiro p rounds to given .08")
      check(.08 > .05, "given p=.08 does not reject at alpha=.05")
      metrics <- list(fixtureP = values[[1]]$p.value, givenInterpretationP = .08)
    },
    RC007 = {
      result <- values[[1]]; expectedMu <- if (q$id == "ME1-Q30") 160 else 150
      near(result$null.value, expectedMu, "one-sample null mean matches question/rubric")
      near(result$parameter, 19, "only twenty Deagu observations selected")
      near(result$estimate, 156.1165, "correct group/height selected")
      check(result$alternative == "two.sided" && grepl("One Sample", result$method), "two-sided one-sample t-test")
      metrics <- list(nullMean = result$null.value, mean = result$estimate, df = result$parameter, fixtureP = result$p.value)
    },
    RC008 = {
      check(all(vapply(values, function(v) inherits(v, "htest") && grepl("Shapiro", v$method), logical(1))), "both groups tested with Shapiro-Wilk")
      near(vapply(values, function(v) unname(v$statistic), numeric(1)),
           c(shapiro.test(e$datat$height[1:20])$statistic, shapiro.test(e$datat$height[21:40])$statistic), "group conditions select intended rows")
      metrics <- list(groupP = vapply(values, function(v) v$p.value, numeric(1)))
    },
    RC009 = {
      result <- tail(values, 1)[[1]]
      check(inherits(result, "htest") && grepl("mean", result$method), "actual lawstat mean-centered Levene test")
      z <- abs(e$datat$height - ave(e$datat$height, e$datat$group, FUN = mean))
      f <- summary(aov(z ~ e$datat$group))[[1]]
      near(result$statistic, f[["F value"]][1], "Levene statistic equals independent absolute-deviation ANOVA")
      near(result$p.value, f[["Pr(>F)"]][1], "Levene p-value matches independent ANOVA")
      metrics <- list(F = result$statistic, fixtureP = result$p.value)
    },
    RC010 = {
      result <- values[[1]]
      check(grepl("Two Sample t-test", result$method, fixed = TRUE) && !grepl("Welch", result$method), "var.equal=TRUE selects pooled not default Welch")
      near(result$parameter, 38, "pooled df n1+n2-2")
      near(result$estimate, c(156.1165, 164), "formula response/group order")
      near(round(lawstat::levene.test(e$datat$height, e$datat$group, location = "mean")$p.value, 4), .1742, "actual Levene p rounds to given .1742")
      check(.1742 > .05, "given Levene p does not reject equality of variances")
      metrics <- list(df = result$parameter, fixtureP = result$p.value, givenLeveneP = .1742)
    },
    RC011 = {
      near(e$d, e$datat2$after - e$datat2$before, "after-before pair order preserved")
      check(mean(e$d) < 0, "negative difference denotes lower after")
      result <- tail(values, 1)[[1]]
      direct <- t.test(e$datat2$after, e$datat2$before, paired = TRUE)
      near(c(result$statistic, result$p.value, result$conf.int),
           c(direct$statistic, direct$p.value, direct$conf.int), "one-sample difference test equals direct paired t-test")
      check(grepl("Shapiro", values[[2]]$method), "normality checked on differences")
      metrics <- list(meanDifference = mean(e$d), t = result$statistic, df = result$parameter, fixtureP = result$p.value)
    },
    RC012 = {
      check(grepl("mean", values[[1]]$method), "mean-centered Levene")
      check(grepl("Two Sample t-test", values[[2]]$method, fixed = TRUE) && !grepl("Welch", values[[2]]$method), "pooled independent t-test")
      near(e$d, e$datat2$after - e$datat2$before, "difference vector not unpaired samples")
      check(grepl("Shapiro", values[[4]]$method), "difference normality test executed")
      metrics <- list(LeveneP = values[[1]]$p.value, pooledT = values[[2]]$statistic, differenceShapiroP = values[[4]]$p.value)
    },
    RC013 = {
      check(identical(all.vars(formula(e$model)), c("y", "x")), "regression direction y~x")
      near(coef(e$model), c(30.933333333333, .870476190476), "actual workbook regression coefficients")
      near(tail(values, 1)[[1]]$r.squared, .682814313504, "actual workbook R-squared")
      check(file.info(plot_file)$size > 1000, "scatterplot PDF rendered")
      metrics <- list(coefficients = coef(e$model), R2 = summary(e$model)$r.squared)
    },
    RC014 = {
      pdf_text <- readLines(plot_file, warn = FALSE)
      check(any(grepl("0.000 0.000 1.000 SCN", pdf_text, fixed = TRUE)), "PDF contains blue regression stroke")
      check(any(grepl("[] 0 d", pdf_text, fixed = TRUE)), "PDF contains solid line dash pattern")
      check(file.info(plot_file)$size > 1000, "abline draws on existing scatterplot")
      metrics <- list(lineType = "solid", color = "blue", plotBytes = file.info(plot_file)$size)
    },
    RC015 = {
      check(inherits(e$result, "summary.lm"), "summary object stored and printed")
      check(all(c("Estimate", "Std. Error", "t value", "Pr(>|t|)") %in% colnames(e$result$coefficients)), "coefficient estimates and individual t-test p-values present")
      near(e$result$r.squared, .682814313504, "R-squared matches supplied workbook")
      f <- e$result$fstatistic
      near(f[[1]], 21.5272738538, "overall model F-statistic", 1e-7)
      metrics <- list(coefficients = e$result$coefficients, R2 = e$result$r.squared,
                      adjustedR2 = e$result$adj.r.squared, F = f,
                      modelP = pf(f[1], f[2], f[3], lower.tail = FALSE))
    },
    RC016 = {
      check(identical(all.vars(formula(e$model2)), c("y", "x1", "x2")), "two main effects, correct response")
      check(length(coef(e$model2)) == 3 && e$model2$rank == 3, "intercept plus two nonaliased slopes, no interaction")
      near(coef(e$model2), qr.solve(cbind(1, e$x1, e$x2), e$y), "multiple regression equals independent matrix least squares")
      metrics <- list(coefficients = coef(e$model2), residualDf = df.residual(e$model2))
    },
    RC017 = {
      near(e$bit, c(0, 1, 2), "Hick information bits")
      expected <- if (q$id == "ME1-Q32") c(280, 120) else c(300, 130)
      near(coef(e$model), expected, "Hick intercept/slope match answer/rubric")
      check(all(grepl("essentially perfect fit", warnings, fixed = TRUE)), "only anticipated perfect-fit warning")
      metrics <- list(bit = e$bit, coefficients = coef(e$model))
    },
    RC018 = {
      expected <- if (q$id == "ME2-Q32") c(350.20, 455.13) else c(398.29, 568.91)
      near(round(e$MT, 2), expected, "both Fitts MT values rounded to requested hundredths")
      if (q$id == "ME2-Q32") {
        approx <- 40 + 120 * c(2.5850, 3.4594)
        metrics$providedLogApproximation <- round(approx, 2)
      }
      metrics <- c(metrics, list(ID = e$ID, MT = e$MT, roundedMT = round(e$MT, 2)))
    },
    RC019 = {
      check(nrow(e$dat) == 8 && nrow(e$clean) == 6, "original eight rows preserved, six valid trials retained")
      check(all(e$clean$Correct & !e$clean$Timeout), "both filters applied")
      near(e$yes$Time, c(500, 550, 590), "YES rows based on actual Present")
      near(e$no$Time, c(650, 690, 740), "NO rows based on actual Present")
      near(coef(e$model_yes), c(366.6666666667, 45), "YES model fits Time~PSS")
      near(coef(e$model_no), c(513.3333333333, 45), "NO model fits Time~PSS")
      metrics <- list(cleanRows = nrow(e$clean), yesCoefficients = coef(e$model_yes), noCoefficients = coef(e$model_no))
    },
    RC020 = {
      check(identical(all.vars(formula(e$model)), c("Time", "bit")), "Hick regression direction Time~bit")
      check(inherits(tail(values, 1)[[1]], "summary.lm"), "summary printed")
      givenP <- if (q$id == "ME4-Q32") .22 else .16
      givenR2 <- if (q$id == "ME4-Q32") .04 else .03
      f <- summary(e$model)$fstatistic
      actualP <- pf(f[1], f[2], f[3], lower.tail = FALSE)
      near(round(actualP, 2), givenP, "actual model p matches supplied rounded output")
      near(round(summary(e$model)$r.squared, 2), givenR2, "actual R-squared matches supplied rounded output")
      check(givenP > .05, "output nonsignificant at alpha=.05")
      metrics <- list(fixtureR2 = summary(e$model)$r.squared,
                      actualP = actualP, givenInterpretationP = givenP, givenInterpretationR2 = givenR2)
    }, stop("Unrecognized original question")
  )
  if (q$originId != "RC017") check(length(warnings) == 0, "no unexpected warnings")
  "pass"
}, error = function(err) {
  if (dev.cur() > 1) dev.off()
  metrics$error <<- conditionMessage(err)
  "fail"
})
write_json(list(id = q$id, originId = q$originId, runtime = R.version.string,
                status = status, checks = checks, metrics = metrics, warnings = warnings,
                inputProvenance = q$inputProvenance),
           out, pretty = TRUE, auto_unbox = TRUE, digits = 15)
if (status != "pass") quit(status = 1)
