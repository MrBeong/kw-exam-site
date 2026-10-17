library(lawstat)

levene.test(
  datat$height,
  datat$group,
  location = "mean"
)
