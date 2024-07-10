/**
 * @fileoverview List of blocks to be supported in the compiler compatibility layer.
 * This is only for native blocks. Extensions should not be listed here.
 */

// Please keep these lists alphabetical.

const stacked = [
    'looks_changestretchby',
    'looks_hideallsprites',
    'looks_say',
    'looks_sayforsecs',
    'looks_setstretchto',
    'looks_switchbackdroptoandwait',
    'looks_think',
    'looks_thinkforsecs',
    'motion_align_scene',
    'motion_glidesecstoxy',
    'motion_glideto',
    'motion_goto',
    'motion_pointtowards',
    'motion_scroll_right',
    'motion_scroll_up',
    'sensing_askandwait',
    'sensing_setdragmode',
    'sound_changeeffectby',
    'sound_changevolumeby',
    'sound_cleareffects',
    'sound_play',
    'sound_playuntildone',
    'sound_seteffectto',
    'sound_setvolumeto',
    'sound_stopallsounds'
];

const inputs = [
    'motion_xscroll',
    'motion_yscroll',
    'sensing_loud',
    'sensing_loudness',
    'sensing_userid',
    'sound_volume',
    'json_new_object',
    'json_to_object',
    'json_to_string',
    'json_keys',
    'json_values',
    'json_value_of_key',
    'json_set_key',
    'json_delete_key',
    'json_join_object',
    'json_has_key',
    'json_new_array',
    'json_to_array',
    'json_value_of_index',
    'json_index_of_value',
    'json_add_item',
    'json_replace_index',
    'json_delete_index',
    'json_delete_all_occurrences',
    'json_join_array',
    'json_has_item',
    'comments_object',
    'comments_array'
];

module.exports = {
    stacked,
    inputs
};
