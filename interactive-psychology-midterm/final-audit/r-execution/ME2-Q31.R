# Question data followed by the completed answer.
x <- c(
  65, 50, 55, 65, 55, 70, 65, 70,
  65, 70, 50, 55
)
y <- c(
  85, 74, 76, 90, 85, 87, 94, 98,
  81, 91, 76, 74
)

model <- lm(y ~ x)
plot(x, y)

abline(
  model,
  lty = 1,
  col = "blue"
)
