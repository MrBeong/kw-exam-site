N <- c(1, 2, 4)
RT <- c(210, 350, 490)

bit <- log2(N)

model <- lm( RT ~ bit )

summary(model)
