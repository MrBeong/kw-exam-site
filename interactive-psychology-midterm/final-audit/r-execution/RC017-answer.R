N <- c(1, 2, 4)
RT <- c(300, 430, 560)

bit <- log2(N)

model <- lm( RT ~ bit)

summary(model)
