for i in `ls /usr/local/lib/libopen*` ; do
nm $i | grep $1 && echo $i
done
