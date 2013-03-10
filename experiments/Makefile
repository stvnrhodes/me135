CC=gcc
CFLAGS= -wall
LDFLAGS = -I/usr/local/include/opencv -lm -lopencv_core -lopencv_highgui -lopencv_video -lopencv_imgproc
<<<<<<< HEAD:experiments/Makefile
SRC= vision.c
OBJECTS = vision.o
=======
SRC= vision.cpp
OBJECTS = vision
>>>>>>> delete me:beaglebone/Makefile
ALL = vision

all: $(ALL)

test: $(OBJECTS)
		$(CC) $(FLAGS) $(LDFLAGS) -o $@ $^

		$(OBJECTS): $(SRC)
		$(CC) $(FLAGS) $(LDFLAGS) -c $<

		.PHONY: clean

clean:
		rm -rf *.o core* $(ALL)
