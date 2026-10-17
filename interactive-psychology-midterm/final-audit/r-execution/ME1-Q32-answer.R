N <- c(1, 2, 4)
RT <- c(280, 400, 520)

bit <- log2(N)

model <- lm(
  RT ~ bit
)

summary(model)
