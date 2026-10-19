clean <- dat[dat$Correct & !dat$Timeout, ]
yes <- clean[clean$Present, ]
no <- clean[!clean$Present, ]

model_yes <- lm( Time ~ PSS, data = yes)

model_no <- lm( Time ~ PSS, data = no)
