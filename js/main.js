(function($) {

    var defaultProfiles = {
        'current': 'Default Profile'
    };
    defaultProfiles[profilesKey] = {
        'Default Profile': {
            checklistData: {}
        }
    }
    var profiles = $.jStorage.get(profilesKey, defaultProfiles);

    jQuery(document).ready(function($) {

        // TODO Find a better way to do this in one pass
        $('ul li[data-id]').each(function() {
            addCheckbox(this);
        });

        populateProfiles();

        $('input[type="checkbox"]').click(function() {
            var id = $(this).attr('id');
            var isChecked = profiles[profilesKey][profiles.current].checklistData[id] = $(this).prop('checked');
            //_gaq.push(['_trackEvent', 'Checkbox', (isChecked ? 'Check' : 'Uncheck'), id]);
            if(isChecked === true) {
                $('[data-id="'+id+'"] label').addClass('completed')
            } else {
                $('[data-id="'+id+'"] label').removeClass('completed');
            }
            $(this).parent().parent().find('li > label > input[type="checkbox"]').each(function() {
                var id = $(this).attr('id');
                profiles[profilesKey][profiles.current].checklistData[id] = isChecked;
                $(this).prop('checked', isChecked);
            });
            $.jStorage.set(profilesKey, profiles);
            calculateTotals();
        });

        $('#profiles').change(function(event) {
            profiles.current = $(this).val();
            $.jStorage.set(profilesKey, profiles);
            populateChecklists();
            //_gaq.push(['_trackEvent', 'Profile', 'Change', profiles.current]);
        });

        $('#profileAdd').click(function() {
            $('#profileModalTitle').html('Add Profile');
            $('#profileModalName').val('');
            $('#profileModalAdd').show();
            $('#profileModalUpdate').hide();
            $('#profileModalDelete').hide();
            $('#profileModal').modal('show');
            //_gaq.push(['_trackEvent', 'Profile', 'Add']);
        });

        $('#profileEdit').click(function() {
            $('#profileModalTitle').html('Edit Profile');
            $('#profileModalName').val(profiles.current);
            $('#profileModalAdd').hide();
            $('#profileModalUpdate').show();
            if (canDelete()) {
                $('#profileModalDelete').show();
            } else {
                $('#profileModalDelete').hide();
            }
            $('#profileModal').modal('show');
            //_gaq.push(['_trackEvent', 'Profile', 'Edit', profiles.current]);
        });

        $('#profileModalAdd').click(function(event) {
            event.preventDefault();
            var profile = $.trim($('#profileModalName').val());
            if (profile.length > 0) {
                if (typeof profiles[profilesKey][profile] == 'undefined') {
                    profiles[profilesKey][profile] = { checklistData: {} };
                }
                profiles.current = profile;
                $.jStorage.set(profilesKey, profiles);
                populateProfiles();
                populateChecklists();
            }
            //_gaq.push(['_trackEvent', 'Profile', 'Create', profile]);
        });

        $('#profileModalUpdate').click(function(event) {
            event.preventDefault();
            var newName = $.trim($('#profileModalName').val());
            if (newName.length > 0 && newName != profiles.current) {
                profiles[profilesKey][newName] = profiles[profilesKey][profiles.current];
                delete profiles[profilesKey][profiles.current];
                profiles.current = newName;
                $.jStorage.set(profilesKey, profiles);
                populateProfiles();
            }
            $('#profileModal').modal('hide');
            //_gaq.push(['_trackEvent', 'Profile', 'Update', profile]);
        });

        $('#profileModalDelete').click(function(event) {
            event.preventDefault();
            if (!canDelete()) {
                return;
            }
            if (!confirm('Are you sure?')) {
                return;
            }
            delete profiles[profilesKey][profiles.current];
            profiles.current = getFirstProfile();
            $.jStorage.set(profilesKey, profiles);
            populateProfiles();
            populateChecklists();
            $('#profileModal').modal('hide');
            //_gaq.push(['_trackEvent', 'Profile', 'Delete']);
        });

        $("#toggleHideCompleted").change(function() {
            var hidden = !$(this).is(':checked');

            

            $('body').toggleClass('hide_completed', !hidden);
        });

        $('#toggleCollapseAll').change(function () {

            
            if ($(this).data("lastState") === null || $(this).data("lastState") === 0) {

                    // close all
                    $('.collapse').collapse('show');

                    // next state will be open all
                    $(this).data("lastState",1);

                }
                
            else {
                

                // initial state...
                // override accordion behavior and open all
                $('.panel-collapse.in').removeData('bs.collapse.in')
                .collapse({parent:true, toggle:false})
                .collapse('hide')
                .removeData('bs.collapse.in')
                // restore single panel behavior
                .collapse({parent:'#tabPlaythrough', toggle:false});

                // next state will be close all
                $(this).data("lastState",0);
            }
            var hidden = !$(this).is(':checked');
            $('body').toggleClass('collapse_all', !hidden);

        });

        $('[data-item-toggle]').change(function() {
            var type = $(this).data('item-toggle');
            var to_hide = $(this).is(':checked');

            calculateTotals();
        });

        calculateTotals();

    });

    function populateProfiles() {
        $('#profiles').empty();
        $.each(profiles[profilesKey], function(index, value) {
            $('#profiles').append($("<option></option>").attr('value', index).text(index));
        });
        $('#profiles').val(profiles.current);
    }

    function populateChecklists() {
        $('input[type="checkbox"]').prop('checked', false);
        $.each(profiles[profilesKey][profiles.current].checklistData, function(index, value) {
            $('#' + index).prop('checked', value);
        });
        calculateTotals();
    }

    function calculateTotals() {
        $('[id$="_overall_total"]').each(function(index) {
            var type = this.id.match(/(.*)_overall_total/)[1];
            var overallCount = 0, overallChecked = 0;
            $('[id^="' + type + '_totals_"]').each(function(index) {
                var regex = new RegExp(type + '_totals_(.*)');
                var regexFilter = new RegExp('^playthrough_(.*)');
                var i = parseInt(this.id.match(regex)[1]);
                var count = 0, checked = 0;
                for (var j = 1; ; j++) {
                    var checkbox = $('#' + type + '_' + i + '_' + j);
                    if (checkbox.length == 0) {
                        break;
                    }
                    if(checkbox.is(':hidden') && checkbox.prop('id').match(regexFilter) && canFilter(checkbox.closest('li'))) {
                        continue;
                    }
                    count++;
                    overallCount++;
                    if (checkbox.prop('checked')) {
                        checked++;
                        overallChecked++;
                    }
                }
                if (checked === count) {
                    this.innerHTML = $('#' + type + '_nav_totals_' + i)[0].innerHTML = 'DONE';
                    $(this).removeClass('in_progress').addClass('done');
                    $($('#' + type + '_nav_totals_' + i)[0]).removeClass('in_progress').addClass('done');
                } else {
                    this.innerHTML = $('#' + type + '_nav_totals_' + i)[0].innerHTML = checked + '/' + count;
                    $(this).removeClass('done').addClass('in_progress');
                    $($('#' + type + '_nav_totals_' + i)[0]).removeClass('done').addClass('in_progress');
                }
            });
            if (overallChecked === overallCount) {
                this.innerHTML = 'DONE';
                $(this).removeClass('in_progress').addClass('done');
            } else {
                this.innerHTML = overallChecked + '/' + overallCount;
                $(this).removeClass('done').addClass('in_progress');
            }
        });
    }

    function addCheckbox(el) {
        var $el = $(el);
        // assuming all content lies on the first line
        var content = $el.html().split('\n')[0];
        var sublists = $el.children('ul');

        content =
            '<div class="checkbox">' +
                '<label>' +
                    '<input type="checkbox" id="' + $el.attr('data-id') + '">' +
                    '<span class="item_content">' + content + '</span>' +
                '</label>' +
            '</div>';

        $el.html(content).append(sublists);

        if (profiles[profilesKey][profiles.current].checklistData[$el.attr('data-id')] === true) {
            $('#' + $el.attr('data-id')).prop('checked', true);
            $('label', $el).addClass('completed');
        }
    }

    function canDelete() {
        var count = 0;
        $.each(profiles[profilesKey], function(index, value) {
            count++;
        });
        return (count > 1);
    }

    function getFirstProfile() {
        for (var profile in profiles[profilesKey]) {
            return profile;
        }
    }

    function canFilter(entry) {
        if (!entry.attr('class')) {
            return false;
        }
        var classList = entry.attr('class').split(/\s+/);
        var foundMatch = 0;
        for (var i = 0; i < classList.length; i++) {
            if (!classList[i].match(/^f_(.*)/)) {
                continue;
            }
            if(classList[i] in profiles[profilesKey][profiles.current].hidden_categories) {
                if(!profiles[profilesKey][profiles.current].hidden_categories[classList[i]]) {
                    return false;
                }
                foundMatch = 1;
            }
        }
        if (foundMatch === 0) {
            return false;
        }
        return true;
    }

    /*
     * -------------------------
     * Back to top functionality
     * -------------------------
     */
    $(function() {
        var offset = 220;
        var duration = 500;
        $(window).scroll(function() {
            if ($(this).scrollTop() > offset) {
                $('.fadingbutton').fadeIn(duration);
            } else {
                $('.fadingbutton').fadeOut(duration);
            }
        });

        $('.back-to-top').click(function(event) {
            event.preventDefault();
            $('html, body').animate({scrollTop: 0}, duration);
            return false;
        });
    });

    $('#toggleHideCompleted').attr('checked', false);

    /*
     * ------------------------------------------
     * Restore tabs/hidden sections functionality
     * ------------------------------------------
     
     $(function() {
        // reset `Hide completed` button state (otherwise Chrome bugs out)
        $('#toggleHideCompleted').attr('checked', false);

        // restore collapsed state on page load
        restoreState(profiles.current);

        if (profiles[profilesKey][profiles.current].current_tab) {
            $('.nav.nav-tabs li a[href="' + profiles[profilesKey][profiles.current].current_tab + '"]').click();
        }

        // register on click handlers to store state
        $('a[href$="_col"]').on('click', function(el) {
            var collapsed_key = $(this).attr('href');
            var saved_tab_state = !!profiles[profilesKey][profiles.current].collapsed[collapsed_key];

            profiles[profilesKey][profiles.current].collapsed[$(this).attr('href')] = !saved_tab_state;

            $.jStorage.set(profilesKey, profiles);
        });

        $('.nav.nav-tabs li a').on('click', function(el) {
            profiles[profilesKey][profiles.current].current_tab = $(this).attr('href');

            $.jStorage.set(profilesKey, profiles);
        });
     });
     */

})( jQuery );
