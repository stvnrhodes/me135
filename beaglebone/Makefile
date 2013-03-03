CC=gcc
CFLAGS= -wall
LDFLAGS = -I/usr/local/include/opencv -lm -lopencv_core -lopencv_highgui -lopencv_video -lopencv_imgproc
SRC= test.c
OBJECTS = test.o
ALL = test

all: $(ALL)

test: $(OBJECTS)
		$(CC) $(FLAGS) $(LDFLAGS) -o $@ $^

		$(OBJECTS): $(SRC)
		$(CC) $(FLAGS) $(LDFLAGS) -c $<

		.PHONY: clean

clean:
		rm -rf *.o core* $(ALL)
