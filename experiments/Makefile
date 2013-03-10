CC=g++
CFLAGS= -wall
LDFLAGS = -I /usr/local/lib/libopencv* -lm -lopencv_core -lopencv_highgui -lopencv_video -lopencv_imgproc
SRC= vision.c
OBJECTS = vision.o
ALL = vision

all: $(ALL)

test: $(OBJECTS)
		$(CC) $(FLAGS) $(LDFLAGS) -o $@ $^

		$(OBJECTS): $(SRC)
		$(CC) $(FLAGS) $(LDFLAGS) -c $<

		.PHONY: clean

clean:
		rm -rf *.o core* $(ALL)
