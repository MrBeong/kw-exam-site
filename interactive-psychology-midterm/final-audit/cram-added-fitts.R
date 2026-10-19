D <- c(60,140)
W <- c(20,20)
ID <- log2(D / W + 1)
MT <- 50 + 150 * ID
stopifnot(all(ID==c(2,3)) && all(MT==c(350,500)))
