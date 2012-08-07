var distriscopia = (function () {

    ////////////////////////////////////////////////////////////////////////////////
    // Globals

    var distributionIndex = 0;

    var distributionList = [
        "Add a distribution ...",
        "Beta(alpha, beta)",
        "Gamma(shape, scale)",
        "Gamma(shape, rate)",
        "Gamma(shape, mean)",
        "Poisson(rate)",
        "Poisson(mean)",
    ];

    ////////////////////////////////////////////////////////////////////////////////
    // Range Control

    function Range(min, max, num_points) {
        this.min = min;
        this.max = max;
        this.num_points = num_points;
        this.real_values = [];
        this.int_values = [];
    }
    Range.prototype.generateValues = function() {
        // adapted from jstat (John Resig; http://ejohn.org/; MIT Licensed)
        this.real_values = [];
        this.int_values = [];
        var xr = this.min;
        var xi = Math.round(this.min);
        // var step = (this._maximum-this._minimum)/(this._numPoints-1);
        var step = (this.max-this.min)/(this.num_points-1);
        var istep = Math.round(step);
        if (istep < 1) {
            istep = 1;
        }
        for(var i = 0; i < this.num_points; i++) {
            this.real_values[i] = parseFloat(xr.toFixed(6));
            if (xi <= this.max) {
                this.int_values[i] = xi;
            }
            xr += step;
            xi += istep;
        }
    }
    var plotRange = new Range(0, 200, 5000);

    ////////////////////////////////////////////////////////////////////////////////
    // Plotting Control

    function plotDistributions(regenerate) {
        var $headers = $(".accordionHeader");
        var plotData = [];
        $headers.each(function(index) {
            var distObj = $(this).data("distObj");
            if (!distObj.hidden) {
                if (regenerate) {
                    distObj.generateValues();
                }
                plotData.push({label: distObj.getTitle(), data:distObj.pdfValues});
            }
            // if (!distObj.hidden) {
            //     if (regenerate) {
            //         distObj.generateValues();
            //     }
            //     plotData.push({label: distObj.getTitle(), data:distObj.pdfValues});
            // }
        });
        $.plot($("#distribution-plotter"), plotData);
    }

    function updateDistributionPlotDomain() {
        var $control = $("#distribution-plot-domain");
        var range = $control.slider("values");
        plotRange.min = range[0];
        plotRange.max = range[1];
        plotRange.generateValues();
        plotDistributions(true);
    }

    ////////////////////////////////////////////////////////////////////////////////
    // Supplemental Statistical Functions

    function poissonPmf( x, m ) {
        var f = 1;
        var r;
        r = Math.pow(m,x)*Math.exp(-m);
        // console.log(x, m, r);
        // console.log(m);
        while (x > 0) {
            f = f*x;
            x--;
        }
        return (r/f);
    }


    ////////////////////////////////////////////////////////////////////////////////
    // UI

    // build page
    function setupPage() {
        setupDistributionSelector();
        $("#distribution-registry").accordion();
        setupPlotDomainWidget();
    }

    // populate selector
    function setupDistributionSelector() {
        var $select = $("#add-distribution");
        $select.html("");
        for (var distIdx = 0; distIdx < distributionList.length; ++distIdx) {
            var distName = distributionList[distIdx];
            $("<option value='" + distName + "'>" + distName + "</option>").appendTo("#add-distribution");
        }
        $select.change(addDistribution);
    }

    // distribution range
    function setupPlotDomainWidget() {
        // slider
        var $slider_widget = $("#distribution-plot-domain");
        var $input_min = $("#distribution-plot-domain-input-min");
        var $input_max = $("#distribution-plot-domain-input-max");
        var defaultRange = [0, 200];

        $slider_widget.slider({
            range: true ,
            min: -1000,
            max: 1000,
            values: defaultRange,
            step: 0.1,
            value: 1009,
            slide: function( event, ui ) {
                var values = ui.values;
                $input_min.val(values[0]);
                $input_max.val(values[1]);
            },
            change: function(event, ui) {
                if (event.originalEvent) {
                    updateDistributionPlotDomain();
                }
            },
        });

        $input_min.change(function (event, ui) {
            if (event.originalEvent) {
                var min = parseFloat(this.value);
                var max = $slider_widget.slider("values")[1];
                $slider_widget.slider("values", [min, max]);
                updateDistributionPlotDomain();
            }
        }).val(defaultRange[0]);

        $input_max.change(function (event, ui) {
            if (event.originalEvent) {
                var min = $slider_widget.slider("values")[0];
                var max = parseFloat(this.value);
                $slider_widget.slider("values", [min, max]);
                updateDistributionPlotDomain();
            }
        }).val(defaultRange[1]);

        updateDistributionPlotDomain();
    }

    // add a new distribution
    function addDistribution() {
        var $select = $(this);
        var $distName = $select.val();
        var $distReg = $("#distribution-registry");
        if ($distName === "Beta(alpha, beta)") {
            $distReg.append(composeBetaDistGeneratorributionControlWidget());
        } else if ($distName === "Gamma(shape, scale)") {
            $distReg.append(composeGammaShapeScaleControlWidget());
        } else if ($distName === "Gamma(shape, rate)") {
            $distReg.append(composeGammaShapeRateControlWidget());
        } else if ($distName === "Gamma(shape, mean)") {
            $distReg.append(composeGammaShapeMeanControlWidget());
        } else if ($distName === "Poisson(rate)") {
            $distReg.append(composePoissonRateControlWidget());
        } else if ($distName === "Poisson(mean)") {
            $distReg.append(composePoissonMeanControlWidget());
        }
        $select.val("Add a distribution ...");
        $distReg.accordion("destroy").accordion({header: 'div.accordionHeader'}).accordion({ active: "div:last" });
        plotDistributions(false);
    }

    function toggleDistributionVisibility(buttonId, headerId) {
        var distObj = $("#" + headerId).data("distObj");
        var $button = $("#" + buttonId);
        if ($button.html() == "Hide") {
            $button.html("Show");
            distObj.hidden = true;
        } else {
            $button.html("Hide");
            distObj.hidden = false;
        }
        // $("#" + bodyId).remove();
        plotDistributions(false);
    }

    function removeDistribution(headerId, bodyId) {
        // var $header = $("#" + containerId);
        // var $content = $header.next();
        // $header.remove();
        // $content.remove();
        $("#" + headerId).remove();
        $("#" + bodyId).remove();
        plotDistributions(false);
    }

    function updateDistributionParams($header, $body) {
        var distObj = $header.data("distObj");
        var paramValues = [];
        $body.find("input.param-value").each(function(index) {
            paramValues.push(parseFloat($(this).val()));
        });
        distObj.setParamList(paramValues);
        var $title = $header.find('#distribution-title');
        $title.text(distObj.getTitle());
        distObj.generateValues();
        plotDistributions(false);
    }

    function getDistributionId() {
        var distId = distributionIndex;
        distributionIndex += 1;
        return distId;
    }

    function composeDistributionControlWidgetTemplate(distId, distObj) {
        var containerHeaderId = "distribution-entry-header-" + distId;
        var containerBodyId = "distribution-entry-body-" + distId;
        var showButtonId = "distribution-show-" + distId;
        html = '<div id="' + containerHeaderId + '" class="accordionHeader" style="valign=middle;"></span>';
        html += '<span id="distribution-title" style="font-size: 70%; font-weight: bold; ">' + distObj.getTitle() + "</span>";
        html += '<button id="' + showButtonId + '" type="button" style="float: right; font-size: 50%" onclick="javascript:distriscopia.toggleDistributionVisibility(';
        html += "'" + showButtonId + "','" + containerHeaderId + "')\">Hide</button>";
        html += '<button type="button" style="float: right; font-size: 50%" onclick="javascript:distriscopia.removeDistribution(';
        html += "'" + containerHeaderId + "','" + containerBodyId + "')\">Remove</button>";
        html += '</div>';
        html += '<div id="' + containerBodyId + '" class="accordionBody">';
        // html += "here it is: ";
        html += '</div>';
        $element = $(html);
        var $header = $element.filter(".accordionHeader");
        var $body = $element.filter(".accordionBody");
        $header.data("distObj", distObj);
        $body.data("distObj", distObj);
        return $element;
    }

    function addParamControlWidget($element, distId, paramId, name, min, max, step, default_val) {
        var sliderId = "param-control-slider-" + distId + "-" + paramId;
        var inputId = "param-control-input-" + distId + "-" + paramId;
        // var containerBodyId = "distribution-entry-body-" + distId;
        // $("#" + containerBodyId, $element).append("hello");
        // $element.each(function(index) {
        //     console.log(index + ": " + $(this).text() + ", " + $(this).attr("id"));
        // });
        var $header = $element.filter(".accordionHeader");
        var $target = $element.filter(".accordionBody");
        var html = "<div style='font-size: 80%; width: 100%'>";
        html += name;
        html += '<div id="' + sliderId + '" style="width: 100%"></div>'
        html += '<input id="' + inputId + '" class="param-value" style="width: 100%"/>';
        html += '</div>';
        $target.append(html);

        // slider
        $("#" + sliderId, $element).slider({
            range: "min" ,
            value: default_val,
            step: step,
            min: min,
            max: max,
            slide: function( event, ui ) {
                if (event.originalEvent) {
                    $("#" + inputId ).val( ui.value );
                    updateDistributionParams($header, $target);
                }
            },
            // change: function(event, ui) {
            //     if (event.originalEvent) {
            //         updateDistributionParams($header, $target);
            //     }
            //     else {
            //         //programmatic change
            //     }
            // },
        });

        // text box
        $("#" + inputId, $element)
        .val(default_val)
        .change(function(event, ui) {
            if (event.originalEvent) {
                var value = this.value;
                $("#" + sliderId).slider("value", parseFloat(value));
                updateDistributionParams($header, $target);
            }
        });

        return $element;
    }

    function composeBetaDistGeneratorributionControlWidget() {
        var distId = getDistributionId();
        var distObj = new BetaDistGenerator(2, 2);
        var $control = composeDistributionControlWidgetTemplate(distId, distObj);
        addParamControlWidget($control, distId, 1, "alpha", 1, 100, 0.01, 2);
        addParamControlWidget($control, distId, 2, "beta", 1, 100, 0.01, 2);
        distObj.generateValues();
        return $control;
    }

    function composeGammaShapeScaleControlWidget() {
        var distId = getDistributionId();
        var distObj = new GammaShapeScaleDistGenerator(2, 2);
        var $control = composeDistributionControlWidgetTemplate(distId, distObj);
        addParamControlWidget($control, distId, 1, "shape", 1, 100, 0.01, 2);
        addParamControlWidget($control, distId, 2, "scale", 1, 100, 0.01, 2);
        distObj.generateValues();
        return $control;
    }

    function composeGammaShapeRateControlWidget() {
        var distId = getDistributionId();
        var distObj = new GammaShapeRateDistGenerator(2, 0.5);
        var $control = composeDistributionControlWidgetTemplate(distId, distObj);
        addParamControlWidget($control, distId, 1, "shape", 1, 100, 0.01, 2);
        addParamControlWidget($control, distId, 2, "rate", 1, 100, 0.01, 0.5);
        distObj.generateValues();
        return $control;
    }

    function composeGammaShapeMeanControlWidget() {
        var distId = getDistributionId();
        var distObj = new GammaShapeMeanDistGenerator(2, 1);
        var $control = composeDistributionControlWidgetTemplate(distId, distObj);
        addParamControlWidget($control, distId, 1, "shape", 1, 100, 0.01, 2);
        addParamControlWidget($control, distId, 2, "mean", 1, 100, 0.01, 1);
        distObj.generateValues();
        return $control;
    }

    function composePoissonRateControlWidget() {
        var distId = getDistributionId();
        var distObj = new PoissonRateDistGenerator(0.1);
        var $control = composeDistributionControlWidgetTemplate(distId, distObj);
        addParamControlWidget($control, distId, 1, "rate", 0.1, 10, 0.01, 0.1);
        distObj.generateValues();
        return $control;
    }

    function composePoissonMeanControlWidget() {
        var distId = getDistributionId();
        var distObj = new PoissonMeanDistGenerator(2);
        var $control = composeDistributionControlWidgetTemplate(distId, distObj);
        addParamControlWidget($control, distId, 1, "mean", 1, 100, 1, 2);
        distObj.generateValues();
        return $control;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // Distribution Classes

    // Base clase //////////////////////////////////////////////////////////////////

    function DistributionGenerator() {
        this.pdfValues = [];
        this.cdfValues = [];
        this.hidden = false;
    }
    DistributionGenerator.prototype.generateValues = function(xrange, pdf, cdf) {
        // var distCalc = new GammaDistribution(this.shape, this.scale);
        this.pdfValues = [];
        this.cdfValues = [];
        // var xrange = plotRange.values;
        for (var i = 0; i < xrange.length; ++i) {
            var x = xrange[i];
            var density = pdf(x);
            if(density != Number.POSITIVE_INFINITY && density != Number.NEGATIVE_INFINITY) {
                this.pdfValues.push([x, density]);
            } else {
                this.pdfValues.push(null);
            }
            // this.cdfValues.push([x, distCalc._cdf(x)]);
        }
    }

    // Continuous Distributions //////////////////////////////////////////////////////

    function ContinuousDistributionGenerator() {
    }
    ContinuousDistributionGenerator.prototype = Object.create(DistributionGenerator.prototype);
    ContinuousDistributionGenerator.prototype.constructor = ContinuousDistributionGenerator;
    ContinuousDistributionGenerator.prototype.generateValues = function(pdf, cdf) {
        var xrange = plotRange.real_values;
        DistributionGenerator.prototype.generateValues.call(this, xrange, pdf, cdf);
    }

    // Discrete Distributions //////////////////////////////////////////////////////

    function DiscreteDistributionGenerator() {
    }
    DiscreteDistributionGenerator.prototype = Object.create(DistributionGenerator.prototype);
    DiscreteDistributionGenerator.prototype.constructor = DiscreteDistributionGenerator;
    DiscreteDistributionGenerator.prototype.generateValues = function(pdf, cdf) {
        var xrange = plotRange.int_values;
        DistributionGenerator.prototype.generateValues.call(this, xrange, pdf, cdf);
    }

    // Beta /////////////////////////////////////////////////////////////

    function BetaDistGenerator(alpha, beta) {
        this.alpha = alpha;
        this.beta = beta;
    }
    // inheritance
    BetaDistGenerator.prototype = Object.create(ContinuousDistributionGenerator.prototype);
    BetaDistGenerator.prototype.constructor = BetaDistGenerator;
    BetaDistGenerator.prototype.getTitle = function() {
        title = "Beta(";
        title += "alpha=" + this.alpha;
        title += ", ";
        title += "beta=" + this.beta;
        title += ")";
        return title;
    }
    BetaDistGenerator.prototype.setParamList = function(paramValues) {
        this.alpha = paramValues[0];
        this.beta = paramValues[1];
    }
    BetaDistGenerator.prototype.generateValues = function(distCalc) {
        var distCalc = new BetaDistribution(this.alpha, this.beta);
        ContinuousDistributionGenerator.prototype.generateValues.call(this,
                function(x) {return distCalc._pdf(x)},
                function(x) {return distCalc._cdf(x)});
    }

    // GammaShapeScale /////////////////////////////////////////////////////////////

    function GammaShapeScaleDistGenerator(shape, scale) {
        this.shape = shape;
        this.scale = scale;
    }
    // inheritance
    // GammaShapeScaleDistGenerator.prototype = new ContinuousDistributionGenerator();
    GammaShapeScaleDistGenerator.prototype = Object.create(ContinuousDistributionGenerator.prototype);
    GammaShapeScaleDistGenerator.prototype.constructor = GammaShapeScaleDistGenerator;
    GammaShapeScaleDistGenerator.prototype.getTitle = function() {
        title = "Gamma(";
        title += "shape=" + this.shape;
        title += ", ";
        title += "scale=" + this.scale;
        title += ")";
        return title;
    }
    GammaShapeScaleDistGenerator.prototype.setParamList = function(paramValues) {
        this.shape = paramValues[0];
        this.scale = paramValues[1];
    }
    GammaShapeScaleDistGenerator.prototype.generateValues = function(distCalc) {
        var distCalc = new GammaDistribution(this.shape, this.scale);
        ContinuousDistributionGenerator.prototype.generateValues.call(this,
                function(x) {return distCalc._pdf(x)},
                function(x) {return distCalc._cdf(x)});
    }

    // GammaShapeRate /////////////////////////////////////////////////////////////

    function GammaShapeRateDistGenerator(shape, rate) {
        this.shape = shape;
        this.rate = rate;
    }
    // inheritance
    GammaShapeRateDistGenerator.prototype = Object.create(ContinuousDistributionGenerator.prototype);
    GammaShapeRateDistGenerator.prototype.constructor = GammaShapeRateDistGenerator;
    GammaShapeRateDistGenerator.prototype.getTitle = function() {
        title = "Gamma(";
        title += "shape=" + this.shape;
        title += ", ";
        title += "rate=" + this.rate;
        title += ")";
        return title;
    }
    GammaShapeRateDistGenerator.prototype.setParamList = function(paramValues) {
        this.shape = paramValues[0];
        this.rate = paramValues[1];
    }
    GammaShapeRateDistGenerator.prototype.generateValues = function(distCalc) {
        var distCalc = new GammaDistribution(this.shape, 1/this.rate);
        ContinuousDistributionGenerator.prototype.generateValues.call(this,
                function(x) {return distCalc._pdf(x)},
                function(x) {return distCalc._cdf(x)});
    }

    // GammaShapeMean /////////////////////////////////////////////////////////////

    function GammaShapeMeanDistGenerator(shape, mean) {
        this.shape = shape;
        this.mean = mean;
    }
    // inheritance
    GammaShapeMeanDistGenerator.prototype = Object.create(ContinuousDistributionGenerator.prototype);
    GammaShapeMeanDistGenerator.prototype.constructor = GammaShapeMeanDistGenerator;
    GammaShapeMeanDistGenerator.prototype.getTitle = function() {
        title = "Gamma(";
        title += "shape=" + this.shape;
        title += ", ";
        title += "mean=" + this.mean;
        title += ")";
        return title;
    }
    GammaShapeMeanDistGenerator.prototype.setParamList = function(paramValues) {
        this.shape = paramValues[0];
        this.mean = paramValues[1];
    }
    GammaShapeMeanDistGenerator.prototype.generateValues = function(distCalc) {
        var distCalc = new GammaDistribution(this.shape, this.mean/this.shape);
        ContinuousDistributionGenerator.prototype.generateValues.call(this,
                function(x) {return distCalc._pdf(x)},
                function(x) {return distCalc._cdf(x)});
    }

    // PoissonRate /////////////////////////////////////////////////////////////

    function PoissonRateDistGenerator(rate) {
        this.rate = rate;
    }
    // inheritance
    PoissonRateDistGenerator.prototype = Object.create(DiscreteDistributionGenerator.prototype);
    PoissonRateDistGenerator.prototype.constructor = PoissonRateDistGenerator;
    PoissonRateDistGenerator.prototype.getTitle = function() {
        title = "Poisson(";
        title += "rate=" + this.rate;
        title += ")";
        return title;
    }
    PoissonRateDistGenerator.prototype.setParamList = function(paramValues) {
        this.rate = paramValues[0];
    }
    PoissonRateDistGenerator.prototype.generateValues = function(distCalc) {
        // console.log(this.rate);
        var mean = 1/this.rate;
        DiscreteDistributionGenerator.prototype.generateValues.call(this,
                function(x) {return poissonPmf(x, mean)},
                function(x) {return x});
    }

    // PoissonMean /////////////////////////////////////////////////////////////

    function PoissonMeanDistGenerator(mean) {
        this.mean = mean;
    }
    // inheritance
    PoissonMeanDistGenerator.prototype = Object.create(DiscreteDistributionGenerator.prototype);
    PoissonMeanDistGenerator.prototype.constructor = PoissonMeanDistGenerator;
    PoissonMeanDistGenerator.prototype.getTitle = function() {
        title = "Poisson(";
        title += "mean=" + this.mean;
        title += ")";
        return title;
    }
    PoissonMeanDistGenerator.prototype.setParamList = function(paramValues) {
        this.mean = paramValues[0];
    }
    PoissonMeanDistGenerator.prototype.generateValues = function(distCalc) {
        var mean = this.mean;
        DiscreteDistributionGenerator.prototype.generateValues.call(this,
                function(x) {return jstat.dopois_raw(x, mean)},
                function(x) {return x});
    }


    // return public interface
    return {
        setupPage: setupPage,
        removeDistribution: removeDistribution,
        toggleDistributionVisibility: toggleDistributionVisibility,
        updateDistributionParams: updateDistributionParams,
    }

})();
