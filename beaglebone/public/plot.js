function Plot(id) {
    // setup plot
  this.options_ = {
      series: { shadowSize: 0 }, // drawing is faster without shadows
      yaxis: { min: 0, max: 12.1 },
      xaxis: { min: 0, mode: 'time', timeformat: "%h:%M:%S" }
  };
  this.time_offset_ = (new Date).getTime();
  this.id_ = id;
  this.num_points_ = 100;
  this.num_lines_ = 2;
  this.data_ = [];
  for (var i = 0; i < this.num_lines_; ++i) {
    this.data_.push([]);
  }
  $.plot($(id), this.data_, this.options_).draw();
}

Plot.prototype.push = function(datum, plot_num) {
  var time = (new Date).getTime() - this.time_offset_
  this.data_[plot_num].push([time, datum]);
  if (this.data_[plot_num].length > this.num_points_) {
    this.data_[plot_num] = this.data_[plot_num].slice(1);
  }
}

Plot.prototype.draw = function() {
  var cutoff = Number.NEGATIVE_INFINITY;
  for (var i = 0; i < this.data_.length; i++) {
    if (this.data_[i][0]) {
      cutoff = Math.max(this.data_[i][0][0], cutoff);
    }
  };
  this.options_.xaxis.min = cutoff;
  this.plot_ = $.plot($(this.id_), this.data_, this.options_).draw();
}