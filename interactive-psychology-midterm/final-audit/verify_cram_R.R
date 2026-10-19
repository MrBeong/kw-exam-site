library(jsonlite)
baseball <- data.frame(득점 = c(80, 16, 128, 41, 111, 22))
datat <- data.frame(
  group = rep(c("Deagu", "Seoul"), each = 20),
  height = c(
    141.977269, 145.731682, 147.81785, 149.374348, 150.666916, 151.804243, 152.843048, 153.817827,
    154.752195, 155.664132, 156.568868, 157.480805, 158.415173, 159.389952, 160.428757, 161.566084,
    162.858652, 164.41515, 166.501318, 170.255731, 144.316825, 149.543331, 152.447477, 154.614274,
    156.413653, 157.996922, 159.443038, 160.800026, 162.100755, 163.37026, 164.62974, 165.899245,
    167.199974, 168.556962, 170.003078, 171.586347, 173.385726, 175.552523, 178.456669, 183.683175
  )
)
datat2 <- data.frame(
  before = c(
    181, 182, 183, 184, 185, 186, 187, 188,
    189, 190, 191, 192, 193, 194, 195, 196,
    197, 198, 199, 200
  ),
  after = c(
    108.787481, 120.027051, 126.716742, 131.961847, 136.487122, 140.589, 144.422176, 148.080733,
    151.629073, 155.116237, 158.583763, 162.070927, 165.619267, 169.277824, 173.111, 177.212878,
    181.738153, 186.983258, 193.672949, 204.912519
  )
)
x <- c(
  65, 50, 55, 65, 55, 70, 65, 70,
  65, 70, 50, 55
)
y <- c(
  85, 74, 76, 90, 85, 87, 94, 98,
  81, 91, 76, 74
)
N <- c(1, 2, 4, 8)
snippets <- fromJSON("cram-code-examples.json")
pdf("cram-code-plots.pdf", width=6, height=4)
values <- vector("list", length(snippets))
for (i in seq_along(snippets)) {
  values[[i]] <- eval(parse(text=snippets[[i]]))
}
dev.off()
checks <- c(
  identical(values[[1]], 80),
  inherits(values[[2]], "htest"),
  identical(unname(values[[3]]$null.value), 150),
  grepl("Two Sample", values[[6]]$method),
  !grepl("Welch", values[[6]]$method),
  identical(unname(values[[6]]$parameter), 38),
  all.equal(datadiff, datat2$after-datat2$before)==TRUE,
  all.equal(mean(datadiff), -33.65)==TRUE,
  identical(unname(values[[9]]$null.value), 0),
  all.equal(unname(coef(model)),c(30.9333333333,.870476190476),tolerance=1e-8)==TRUE,
  abs(summary(model)$r.squared-.682814)<1e-6,
  identical(a, baseball$득점),
  mean(a)==sum(a)/length(a),
  median(a)==(41+80)/2,
  var(a)==sum((a-mean(a))^2)/(length(a)-1),
  abs(sd(a)^2-var(a))<1e-10,
  identical(unname(quantile(a))[c(1,5)],c(16,128)),
  min(a)==16,max(a)==128,
  identical(bit,c(0,1,2,3)),
  all.equal(t.test(datadiff)$statistic,t.test(datat2$after,datat2$before,paired=TRUE)$statistic)==TRUE,
  all.equal(t.test(datat[datat$group=="Deagu",]$height,mu=150)$statistic,t.test(mu=150,x=datat[datat$group=="Deagu",]$height,alternative="two.sided")$statistic)==TRUE
)
stopifnot(all(checks))
write_json(list(status="passed", snippets=length(snippets), assertions=length(checks), runtime=R.version.string, packages=list(lawstat=as.character(packageVersion("lawstat")),jsonlite=as.character(packageVersion("jsonlite"))), checks=checks, constructed_fixture=TRUE),"cram-r-results.json",pretty=TRUE,auto_unbox=TRUE)
