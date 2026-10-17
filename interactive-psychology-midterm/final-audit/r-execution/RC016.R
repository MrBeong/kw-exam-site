# Question data followed by the completed answer.
x1 <- c(
  65, 50, 55, 65, 55, 70, 65, 70,
  65, 70, 50, 55
)
x2 <- c(
  3, 7, 5, 1, 3, 3, 1, 2,
  4, 2, 3, 4
)
y <- c(
  85, 74, 76, 90, 85, 87, 94, 98,
  81, 91, 76, 74
)

model2 <- lm(
  y ~ x1 + x2
)
