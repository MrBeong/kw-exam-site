d <- datat2$after - datat2$before

shapiro.test(d)

t.test(
  d,
  mu = 0
)
