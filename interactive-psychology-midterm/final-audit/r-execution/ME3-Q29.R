# Question data followed by the completed answer.
a <- c(1, 2, 3, 4, 100)

dat <- data.frame(
  value = a,
  condition = factor(c("A", "A", "B", "B", "B"))
)

quantile(a)
boxplot(a)
summary(dat)
