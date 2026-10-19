# Question data followed by the completed answer.
N <- c(1, 2, 4)
RT <- c(240, 360, 480)

N <- c(1, 2, 4)
RT <- c(240, 360, 480)

bit <- log2(N)

model <- lm( RT ~ bit )

summary(model)
