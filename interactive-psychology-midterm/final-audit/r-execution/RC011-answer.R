datadiff = datat2$after - datat2$before
shapiro.test(datadiff)
t.test(datadiff)
