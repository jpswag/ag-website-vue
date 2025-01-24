<template>
  <div class="unlocked-hint">
    <div class="hint-wrapper">
      <div class="hint-title">
        Hint {{ hint.hint_number + 1 }} for {{ display_mutant_name(hint) }}
      </div>
      <div class="hint-text">{{ hint.hint_text }}</div>
    </div>

    <form v-if="hint.hint_rating === null" class="feedback-form">
      <div class="feedback-prompt">
        Help us improve. Was this hint useful?
      </div>

      <div class="option-container">
        <div class="radio-container">
          <input
            type="radio" name="hint_rating"
            class="radio"
            v-model="d_hint_rating"
            :value="3"
            :id="`very-useful-${d_radio_button_random_num}`"
          >
          <label
            class="label"
            :for="`very-useful-${d_radio_button_random_num}`">
            Very useful
          </label>
        </div>

        <div class="radio-container">
          <input
            type="radio" name="hint_rating"
            class="radio"
            v-model="d_hint_rating"
            :value="2"
            :id="`somewhat-useful-${d_radio_button_random_num}`"
          >
          <label
            class="label"
            :for="`somewhat-useful-${d_radio_button_random_num}`">
            Somewhat useful
          </label>
        </div>

        <div class="radio-container">
          <input
            type="radio" name="hint_rating"
            class="radio"
            v-model="d_hint_rating"
            :value="1"
            :id="`not-useful-${d_radio_button_random_num}`"
          >
          <label
            class="label"
            :for="`not-useful-${d_radio_button_random_num}`">
            Not useful
          </label>
        </div>
      </div>

      <div class="comment-box">
        <div>Any comments?</div>
        <textarea v-model="d_user_comment" cols="30" rows="2" class="input"></textarea>
      </div>

      <button
        class="green-button rate-hint-button"
        @click="rate_hint"
        :disabled="d_saving || d_hint_rating === null"
      >Send feedback</button>
    </form>
    <APIErrors ref="api_errors"></APIErrors>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import APIErrors from '@/components/api_errors.vue';
import { handle_api_errors_async, make_error_handler_func } from '@/error_handling';
import { assert_not_null, toggle } from '@/utils';
import { display_mutant_name, MutantHintService, UnlockedHintData } from './mutant_hint_service';

@Component({
  components: {
    APIErrors
  }
})
export default class UnlockedHint extends Vue {
  @Prop({required: true, type: Object})
  hint!: UnlockedHintData;

  d_hint_rating: number | null = null;
  d_user_comment: string = '';
  d_saving = false;

  d_radio_button_random_num = Math.floor(Math.random() * 1000000);

  readonly display_mutant_name = display_mutant_name;

  @Watch('hint', {deep: true})
  on_hint_change(new_value: UnlockedHintData, old_value: UnlockedHintData) {
    this.d_hint_rating = new_value.hint_rating;
    this.d_user_comment = new_value.user_comment;
  }

  @handle_api_errors_async(make_error_handler_func())
  rate_hint() {
    return toggle(this, 'd_saving', () => {
      assert_not_null(this.d_hint_rating);
      (<APIErrors> this.$refs.api_errors).clear();
      return MutantHintService.rate_hint(
        this.hint.pk,
        {hint_rating: this.d_hint_rating, user_comment: this.d_user_comment}
      );
    });
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/colors.scss';
@import '@/styles/forms.scss';
@import '@/styles/button_styles.scss';

.unlocked-hint {
  // margin-top: .5rem;
  padding: .5rem .625rem;
  border: 1px solid $pebble-medium;
  // font-size: .875rem;
}

.hint-wrapper {
}

.hint-title {
  padding: .125rem 0;
  // font-size: .875em;
  font-weight: bold;
}

.hint-text {

}

.feedback-form {
  font-size: .875rem;
  padding-top: .75rem;
}

.feedback-prompt {
  // padding-top: .25rem;
}

.comment-box {
  padding-top: .5rem;
}

.rate-hint-button {
  padding: .25rem .5rem;
  font-size: .875rem;
}

</style>
