# (가) 평균 중심 Levene 검정
levene.test(datat$height, datat$group, location = "mean")

# (나) 등분산 가정형 독립표본 t-검정
t.test(data = datat, height ~ group, var.equal = TRUE)

# (다) 같은 사람의 전후 차이 정규성
datadiff = datat2$after - datat2$before
shapiro.test(datadiff)
