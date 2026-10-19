# Question data followed by the completed answer.
dat <- data.frame(
  PSS = c(3, 4, 5, 3, 4, 5, 3, 3),
  Present = c(TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE),
  Correct = c(TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE),
  Timeout = c(FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE),
  Time = c(500, 550, 590, 650, 690, 740, 850, 5000)
)

clean <- dat[dat$Correct & !dat$Timeout, ]
yes <- clean[clean$Present, ]
no <- clean[!clean$Present, ]

model_yes <- lm( Time ~ PSS, data = yes)

model_no <- lm( Time ~ PSS, data = no)
